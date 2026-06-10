import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SupplyChainModule } from './supply-chain/supply-chain.module';
import { AuthModule } from './auth/auth.module';
import { IpfsModule } from './ipfs/ipfs.module';
import { CarbonAccountingModule } from './carbon-accounting/carbon.module';
import { CertificatesModule } from './certificates/certificates.module';
import { VerifiersModule } from './verifiers/verifiers.module';
import { StellarModule } from './stellar/stellar.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { IndexerModule } from './indexer/indexer.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimingInterceptor } from './common/interceptors/timing.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    StellarModule,
    ProductsModule,
    SupplyChainModule,
    AuthModule,
    IpfsModule,
    CarbonAccountingModule,
    CertificatesModule,
    VerifiersModule,
    WebhooksModule,
    IndexerModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
