import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async register(
    @Body() body: { url: string; events: string[]; secret: string },
  ) {
    return this.webhookService.register(body.url, body.events, body.secret);
  }

  @Get()
  async findAll() {
    return this.webhookService.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.webhookService.remove(id);
  }

  @Post(':id/test')
  async test(@Param('id') id: string) {
    await this.webhookService.dispatch('webhook.test', {
      webhookId: id,
      message: 'This is a test webhook event',
      timestamp: new Date().toISOString(),
    });
    return { message: 'Test event dispatched' };
  }

  @Get(':id/events')
  async getEvents(@Param('id') id: string) {
    return this.webhookService.findEvents(id);
  }

  @Post('events/:eventId/retry')
  async retryEvent(@Param('eventId') eventId: string) {
    await this.webhookService.retry(eventId);
    return { message: 'Retry initiated' };
  }
}
