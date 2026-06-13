import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { CertificatesRepository } from './certificates.repository';
import { PdfGeneratorService } from './generators/pdf-generator';
import { JsonLdGeneratorService } from './generators/jsonld-generator';
import { HtmlGeneratorService } from './generators/html-generator';

@Module({
  controllers: [CertificatesController],
  providers: [
    CertificatesService,
    CertificatesRepository,
    PdfGeneratorService,
    JsonLdGeneratorService,
    HtmlGeneratorService,
  ],
  exports: [CertificatesService, CertificatesRepository],
})
export class CertificatesModule {}
