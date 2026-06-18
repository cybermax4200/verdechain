import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StellarService } from '../stellar/stellar.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { PdfGeneratorService, CertificateData } from './generators/pdf-generator';
import { JsonLdGeneratorService } from './generators/jsonld-generator';
import { HtmlGeneratorService } from './generators/html-generator';
import { CertificatesRepository, CertificateFilters } from './certificates.repository';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private readonly repository: CertificatesRepository,
    private readonly prisma: PrismaService,
    private readonly stellarService: StellarService,
    private readonly ipfsService: IpfsService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly jsonLdGenerator: JsonLdGeneratorService,
    private readonly htmlGenerator: HtmlGeneratorService,
  ) {}

  async issue(dto: IssueCertificateDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { manufacturer: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const certData: CertificateData = {
      id: crypto.randomUUID(),
      title: dto.title,
      certType: dto.certType,
      description: dto.description,
      productName: product.name,
      productSku: product.sku ?? undefined,
      productBatch: product.batchNumber ?? undefined,
      manufacturerName: product.manufacturer?.name ?? 'Unknown',
      manufacturerCountry: product.manufacturer?.country ?? undefined,
      issuerName: dto.issuerId,
      issuedAt: new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      certificateId: `VC-${Date.now()}`,
      verificationUrl: `${process.env['API_URL'] ?? 'http://localhost:3000'}/certificates/verify`,
    };

    const pdfBuffer = await this.pdfGenerator.generateCertificate(certData);
    const ipfsResult = await this.ipfsService.upload(
      pdfBuffer,
      `certificate-${certData.certificateId}.pdf`,
    );

    this.jsonLdGenerator.generateProvenanceDocument({
      productId: product.id,
      productName: product.name,
      sku: product.sku ?? undefined,
      batchNumber: product.batchNumber ?? undefined,
      manufacturer: {
        name: product.manufacturer?.name ?? 'Unknown',
        publicKey: product.manufacturer?.publicKey ?? '',
      },
      certificates: [
        {
          id: ipfsResult.cid,
          certType: dto.certType,
          title: dto.title,
          issuedAt: new Date(),
          status: 'active',
        },
      ],
    });

    try {
      await this.stellarService.callContract('greenTagCert', 'issue_certificate');
    } catch (error) {
      this.logger.warn(
        `Stellar contract call failed (certificate will be off-chain only): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const certificate = await this.repository.create({
      product: { connect: { id: dto.productId } },
      certType: dto.certType as any,
      title: dto.title,
      description: dto.description ?? null,
      issuerId: dto.issuerId ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      ipfsHash: ipfsResult.cid,
      metadata: (dto.metadata ?? {}) as any,
      status: 'active',
    });

    return certificate;
  }

  async verify(id: string) {
    const certificate = await this.repository.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    let onChainValid = true;
    try {
      await this.stellarService.simulateContract('greenTagCert', 'verify_certificate');
    } catch {
      onChainValid = false;
    }

    const ipfsValid = certificate.ipfsHash ? await this.verifyIpfsHash(certificate.ipfsHash) : true;

    const valid = certificate.status === 'active' && onChainValid && ipfsValid;

    return {
      valid,
      certificate,
      message: valid ? 'Certificate is valid' : 'Certificate is invalid or revoked',
    };
  }

  async revoke(id: string, reason: string) {
    const certificate = await this.repository.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }
    if (certificate.status !== 'active') {
      throw new BadRequestException('Certificate is not active');
    }

    try {
      await this.stellarService.callContract('greenTagCert', 'revoke_certificate');
    } catch (error) {
      this.logger.warn(
        `Stellar contract revoke failed (revoking off-chain only): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const updated = await this.repository.update(id, {
      status: 'revoked',
      revokedAt: new Date(),
      revocationReason: reason,
    });

    return updated;
  }

  async findOne(id: string) {
    const certificate = await this.repository.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }
    return certificate;
  }

  async findAll(filters: CertificateFilters) {
    return this.repository.findAll(filters);
  }

  async getCertificatePdf(id: string): Promise<Buffer> {
    const certificate = await this.repository.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (certificate.ipfsHash) {
      try {
        return await this.ipfsService.get(certificate.ipfsHash);
      } catch (error) {
        this.logger.warn(
          `IPFS fetch failed, generating PDF from data: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const certData: CertificateData = {
      id: certificate.id,
      title: certificate.title,
      certType: certificate.certType,
      description: certificate.description ?? undefined,
      productName: (certificate.product as any)?.name ?? 'Unknown',
      productSku: (certificate.product as any)?.sku ?? undefined,
      productBatch: (certificate.product as any)?.batchNumber ?? undefined,
      manufacturerName: (certificate.product as any)?.manufacturer?.name ?? 'Unknown',
      manufacturerCountry: (certificate.product as any)?.manufacturer?.country ?? undefined,
      issuerName: certificate.issuerId ?? undefined,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt ?? undefined,
      certificateId: `VC-${certificate.id.slice(0, 8)}`,
      verificationUrl: `${process.env['API_URL'] ?? 'http://localhost:3000'}/certificates/verify`,
    };

    return this.pdfGenerator.generateCertificate(certData);
  }

  async getCertificatesByProduct(productId: string) {
    return this.repository.findByProduct(productId);
  }

  async getHtmlPreview(id: string): Promise<string> {
    const certificate = await this.repository.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return this.htmlGenerator.generatePreview({
      id: certificate.id,
      title: certificate.title,
      certType: certificate.certType,
      description: certificate.description ?? undefined,
      productName: (certificate.product as any)?.name ?? 'Unknown',
      issuerName: certificate.issuerId ?? undefined,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt ?? undefined,
      status: certificate.status,
      ipfsHash: certificate.ipfsHash ?? undefined,
    });
  }

  private async verifyIpfsHash(cid: string): Promise<boolean> {
    try {
      await this.ipfsService.get(cid);
      return true;
    } catch {
      return false;
    }
  }
}
