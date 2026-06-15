import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';

export interface WebhookPayload {
  eventType: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000;

  constructor(private readonly prisma: PrismaService) {}

  async dispatch(eventType: string, data: Record<string, unknown>): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        active: true,
        events: { has: eventType },
      },
    });

    if (webhooks.length === 0) {
      this.logger.debug(`No webhooks registered for event: ${eventType}`);
      return;
    }

    const payload: WebhookPayload = {
      eventType,
      data,
      timestamp: new Date(),
    };

    for (const webhook of webhooks) {
      try {
        await this.sendWebhook(webhook, payload);
      } catch (error) {
        this.logger.error(`Failed to dispatch to webhook ${webhook.id}: ${error instanceof Error ? error.message : String(error)}`);
        await this.scheduleRetry(webhook.id, payload);
      }
    }
  }

  private async sendWebhook(
    webhook: { id: string; url: string; secret: string },
    payload: WebhookPayload,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = this.sign(body, webhook.secret);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': payload.timestamp.toISOString(),
      },
      body,
    });

    await this.prisma.webhookEvent.create({
      data: {
        webhookId: webhook.id,
        eventType: payload.eventType,
        payload: payload as any,
        status: response.ok ? 'delivered' : 'failed',
        response: { status: response.status, statusText: response.statusText } as any,
      },
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    }
  }

  private async scheduleRetry(webhookId: string, payload: WebhookPayload): Promise<void> {
    await this.prisma.webhookEvent.create({
      data: {
        webhookId,
        eventType: payload.eventType,
        payload: payload as any,
        status: 'pending_retry',
        attempts: 0,
      },
    });
  }

  async retry(eventId: string): Promise<void> {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { id: eventId },
      include: { webhook: true },
    });

    if (!event) {
      throw new Error(`Webhook event ${eventId} not found`);
    }
    if (!event.webhook.active) {
      throw new Error('Webhook is deactivated');
    }
    if (event.attempts >= this.maxRetries) {
      throw new Error('Max retry attempts exceeded');
    }

    const delay = this.baseDelay * Math.pow(2, event.attempts);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.sendWebhook(event.webhook, event.payload as unknown as WebhookPayload);

      await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'delivered',
          attempts: { increment: 1 },
        },
      });
    } catch (error) {
      const newAttempts = event.attempts + 1;
      await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: newAttempts >= this.maxRetries ? 'failed' : 'pending_retry',
          attempts: newAttempts,
        },
      });
      this.logger.warn(`Webhook retry ${newAttempts}/${this.maxRetries} failed for event ${eventId}`);
    }
  }

  sign(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  async register(url: string, events: string[], secret: string) {
    return this.prisma.webhook.create({
      data: { url, events, secret, active: true },
    });
  }

  async findAll() {
    return this.prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    await this.prisma.webhookEvent.deleteMany({ where: { webhookId: id } });
    return this.prisma.webhook.delete({ where: { id } });
  }

  async findEvents(webhookId: string) {
    return this.prisma.webhookEvent.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
