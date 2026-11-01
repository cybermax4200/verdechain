import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CertificatesController } from '../../../src/certificates/certificates.controller';
import { CertificatesService } from '../../../src/certificates/certificates.service';
import { CertType } from '../../../src/certificates/dto/issue-certificate.dto';

describe('CertificatesController', () => {
  let controller: CertificatesController;
  let service: CertificatesService;

  const mockService = {
    issue: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    verify: jest.fn(),
    revoke: jest.fn(),
    getCertificatesByProduct: jest.fn(),
    getCertificatePdf: jest.fn(),
    getHtmlPreview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificatesController],
      providers: [
        {
          provide: CertificatesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CertificatesController>(CertificatesController);
    service = module.get<CertificatesService>(CertificatesService);
    jest.clearAllMocks();
  });

  describe('issue', () => {
    it('should delegate issuing to service', async () => {
      const dto = {
        productId: 'prod-1',
        title: 'Recycled Aluminum',
        certType: CertType.RECYCLED,
        issuerPublicKey: 'GBR...',
      };
      mockService.issue.mockResolvedValue({ id: 'cert-1', ...dto });

      const result = await controller.issue(dto as any);
      expect(service.issue).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('cert-1');
    });
  });

  describe('findAll', () => {
    it('should return paginated certificates', async () => {
      const query = { page: 1, limit: 10 };
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll(query as any);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.total).toBe(0);
    });
  });

  describe('getByProduct', () => {
    it('should return certificates for given product ID', async () => {
      mockService.getCertificatesByProduct.mockResolvedValue([{ id: 'cert-1' }]);

      const result = await controller.getByProduct('prod-1');
      expect(service.getCertificatesByProduct).toHaveBeenCalledWith('prod-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('verify', () => {
    it('should verify with certificateId', async () => {
      mockService.verify.mockResolvedValue({ valid: true });

      const result = await controller.verify({ certificateId: 'cert-1' });
      expect(service.verify).toHaveBeenCalledWith('cert-1');
      expect(result.valid).toBe(true);
    });

    it('should verify with id fallback', async () => {
      mockService.verify.mockResolvedValue({ valid: true });

      const result = await controller.verify({ id: 'cert-2' });
      expect(service.verify).toHaveBeenCalledWith('cert-2');
      expect(result.valid).toBe(true);
    });

    it('should throw BadRequestException if neither certificateId nor id is provided', async () => {
      await expect(controller.verify({})).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return certificate by id', async () => {
      mockService.findOne.mockResolvedValue({ id: 'cert-1', title: 'Carbon Neutral' });

      const result = await controller.findOne('cert-1');
      expect(service.findOne).toHaveBeenCalledWith('cert-1');
      expect(result.id).toBe('cert-1');
    });
  });

  describe('revoke', () => {
    it('should revoke certificate with reason', async () => {
      mockService.revoke.mockResolvedValue({ id: 'cert-1', status: 'revoked' });

      const result = await controller.revoke('cert-1', 'Audit failed');
      expect(service.revoke).toHaveBeenCalledWith('cert-1', 'Audit failed');
      expect(result.status).toBe('revoked');
    });

    it('should default reason if none provided', async () => {
      mockService.revoke.mockResolvedValue({ id: 'cert-1', status: 'revoked' });

      await controller.revoke('cert-1', undefined);
      expect(service.revoke).toHaveBeenCalledWith('cert-1', 'No reason provided');
    });
  });

  describe('preview and pdf', () => {
    it('should return html preview', async () => {
      mockService.getHtmlPreview.mockResolvedValue('<html>Cert</html>');

      const result = await controller.getPreview('cert-1');
      expect(service.getHtmlPreview).toHaveBeenCalledWith('cert-1');
      expect(result).toBe('<html>Cert</html>');
    });

    it('should send pdf buffer to response', async () => {
      const buffer = Buffer.from('pdf');
      mockService.getCertificatePdf.mockResolvedValue(buffer);

      const res = {
        send: jest.fn(),
      } as any;

      await controller.getPdf('cert-1', res);
      expect(res.send).toHaveBeenCalledWith(buffer);
    });
  });
});
