import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { SyncService } from './sync.service';
import { ProductProcessor } from './processors/product-processor';
import { LifecycleProcessor } from './processors/lifecycle-processor';
import { AttestationProcessor } from './processors/attestation-processor';
import { CertificateProcessor } from './processors/certificate-processor';
import { VerifierProcessor } from './processors/verifier-processor';

@Module({
  providers: [
    IndexerService,
    SyncService,
    ProductProcessor,
    LifecycleProcessor,
    AttestationProcessor,
    CertificateProcessor,
    VerifierProcessor,
  ],
  exports: [IndexerService, SyncService],
})
export class IndexerModule {}
