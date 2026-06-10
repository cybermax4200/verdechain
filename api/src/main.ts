import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('VerdeChain API')
    .setDescription('Transparent, tamper-proof green supply chain traceability API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('products', 'Product registry and management')
    .addTag('supply-chain', 'Lifecycle event recording and tracking')
    .addTag('carbon', 'Carbon footprint accounting and analysis')
    .addTag('certificates', 'GreenTag certificate management')
    .addTag('verifiers', 'Verifier registry and staking')
    .addTag('auth', 'SEP-10 wallet authentication')
    .addTag('ipfs', 'IPFS pinning and retrieval')
    .addTag('webhooks', 'Webhook event subscriptions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`VerdeChain API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/v1/docs`);
}

bootstrap();
