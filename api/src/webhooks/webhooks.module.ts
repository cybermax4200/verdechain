import { Global, Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhooksController } from './webhooks.controller';

@Global()
@Module({
  controllers: [WebhooksController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhooksModule {}
