import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CertificatesService } from '../../../src/certificates/certificates.service';
import { CertificatesRepository } from '../../../src/certificates/certificates.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { StellarService } from '../../../src/stellar/stellar.service';
import { IpfsService } from '../../../src/ipfs/ipfs.service';
import { PdfGeneratorService } from '../../../src/certificates/generators/pdf-generator';
import { JsonLdGeneratorService } from '../../../src/certificates/generators/jsonld-generator';
import { HtmlGeneratorService } from '../../../src/certificates/generators/html-generator';
import { CertType } from '../../../src/certificates/dto/issue-certificate.dto';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let prisma: PrismaService;

  const mockRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByProduct: jest.fn(),
    update: jest.fn(),
  };

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
    },
  };

  const mockStellar = {
    callContract: jest.fn(),
    simulateContract: jest.fn(),
  };

  const mockIpfs = {
    upload: jest.fn(),
    get: jest.fn(),
  };

  const mockPdf = {
    generateCertificate: jest.fn(),
  };

  const mockJsonLd = {
    generateProvenanceDocument: jest.fn(),
  };

  const mockHtml = {
    generatePreview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: CertificatesRepository, useValue: mockRepo },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StellarService, useValue: mockStellar },
        { provide: IpfsService, useValue: mockIpfs },
        { provide: PdfGeneratorService, useValue: mockPdf },
        { provide: JsonLdGeneratorService, useValue: mockJsonLd },
        { provide: HtmlGeneratorService, useValue: mockHtml },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('issue', () => {
    it('should throw NotFoundException if product does not exist', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.issue({
          productId: 'nonexistent',
          title: 'Eco Label',
          certType: CertType.GREEN_TAG,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should issue certificate, upload to IPFS, and save to repository', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Eco Fabric',
        manufacturer: { name: 'Acme', publicKey: 'GBR123', country: 'DE' },
      };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      mockPdf.generateCertificate.mockResolvedValue(Buffer.from('pdf-data'));
      mockIpfs.upload.mockResolvedValue({ cid: 'QmHash123' });
      mockStellar.callContract.mockResolvedValue({ hash: 'txhash' });
      mockRepo.create.mockResolvedValue({
        id: 'cert-1',
        title: 'Eco Label',
        status: 'active',
        ipfsHash: 'QmHash123',
      });

      const result = await service.issue({
        productId: 'prod-1',
        title: 'Eco Label',
        certType: CertType.GREEN_TAG,
      });

      expect(mockPdf.generateCertificate).toHaveBeenCalled();
      expect(mockIpfs.upload).toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result.id).toBe('cert-1');
    });
  });

  describe('verify', () => {
    it('should throw NotFoundException when certificate is not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.verify('cert-notfound')).rejects.toThrow(NotFoundException);
    });

    it('should return valid=true when certificate is active, simulated on-chain, and IPFS verified', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'cert-1',
        status: 'active',
        ipfsHash: 'QmHash123',
      });
      mockStellar.simulateContract.mockResolvedValue(true);
      mockIpfs.get.mockResolvedValue(Buffer.from('data'));

      const result = await service.verify('cert-1');
      expect(result.valid).toBe(true);
      expect(result.message).toContain('valid');
    });

    it('should return valid=false when certificate status is revoked', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'cert-1',
        status: 'revoked',
        ipfsHash: 'QmHash123',
      });
      mockStellar.simulateContract.mockResolvedValue(true);
      mockIpfs.get.mockResolvedValue(Buffer.from('data'));

      const result = await service.verify('cert-1');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('invalid or revoked');
    });
  });

  describe('revoke', () => {
    it('should throw NotFoundException if certificate not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.revoke('cert-none', 'test reason')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if certificate is already not active', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'cert-1', status: 'revoked' });

      await expect(service.revoke('cert-1', 'test reason')).rejects.toThrow(BadRequestException);
    });

    it('should revoke certificate and update repository', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'cert-1', status: 'active' });
      mockStellar.callContract.mockResolvedValue(true);
      mockRepo.update.mockResolvedValue({
        id: 'cert-1',
        status: 'revoked',
        revocationReason: 'Audit failed',
      });

      const result = await service.revoke('cert-1', 'Audit failed');
      expect(result.status).toBe('revoked');
      expect(mockRepo.update).toHaveBeenCalledWith(
        'cert-1',
        expect.objectContaining({
          status: 'revoked',
          revocationReason: 'Audit failed',
        }),
      );
    });
  });

  describe('findOne and findAll', () => {
    it('should throw NotFoundException on findOne when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findOne('cert-missing')).rejects.toThrow(NotFoundException);
    });

    it('should return certificate when found', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'cert-1' });
      const cert = await service.findOne('cert-1');
      expect(cert.id).toBe('cert-1');
    });

    it('should delegate findAll to repository', async () => {
      mockRepo.findAll.mockResolvedValue({ data: [], total: 0 });
      const result = await service.findAll({});
      expect(result.total).toBe(0);
    });
  });
});
