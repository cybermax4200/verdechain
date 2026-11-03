import { Test, TestingModule } from '@nestjs/testing';
import { AttestationsController } from '../../../src/verifiers/attestations.controller';
import { VerifiersService } from '../../../src/verifiers/verifiers.service';

describe('AttestationsController', () => {
  let controller: AttestationsController;
  let verifiersService: VerifiersService;

  const mockService = {
    submitAttestation: jest.fn(),
    approveAttestation: jest.fn(),
    rejectAttestation: jest.fn(),
    escalateAttestation: jest.fn(),
    getAttestation: jest.fn(),
    getAttestationsByProduct: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttestationsController],
      providers: [
        {
          provide: VerifiersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AttestationsController>(AttestationsController);
    verifiersService = module.get<VerifiersService>(VerifiersService);
    jest.clearAllMocks();
  });

  it('should submit attestation', async () => {
    const expected = { id: 'att-1', productId: 'prod-1', status: 'PENDING' };
    mockService.submitAttestation.mockResolvedValue(expected);

    const result = await controller.submit({ productId: 'prod-1', threshold: 3 });
    expect(verifiersService.submitAttestation).toHaveBeenCalledWith('prod-1', undefined, 3);
    expect(result).toEqual(expected);
  });

  it('should approve attestation', async () => {
    const expected = { id: 'att-1', status: 'APPROVED' };
    mockService.approveAttestation.mockResolvedValue(expected);

    const result = await controller.approve('att-1', 'ver-1');
    expect(verifiersService.approveAttestation).toHaveBeenCalledWith('att-1', 'ver-1');
    expect(result).toEqual(expected);
  });

  it('should reject attestation', async () => {
    const expected = { id: 'att-1', status: 'REJECTED' };
    mockService.rejectAttestation.mockResolvedValue(expected);

    const result = await controller.reject('att-1', 'invalid evidence', 'ver-1');
    expect(verifiersService.rejectAttestation).toHaveBeenCalledWith('att-1', 'invalid evidence', 'ver-1');
    expect(result).toEqual(expected);
  });

  it('should escalate attestation', async () => {
    const expected = { id: 'att-1', status: 'ESCALATED' };
    mockService.escalateAttestation.mockResolvedValue(expected);

    const result = await controller.escalate('att-1', 'audit required', 'ver-1');
    expect(verifiersService.escalateAttestation).toHaveBeenCalledWith('att-1', 'audit required', 'ver-1');
    expect(result).toEqual(expected);
  });

  it('should get attestation by id', async () => {
    const expected = { id: 'att-1' };
    mockService.getAttestation.mockResolvedValue(expected);

    const result = await controller.getOne('att-1');
    expect(verifiersService.getAttestation).toHaveBeenCalledWith('att-1');
    expect(result).toEqual(expected);
  });

  it('should get attestations by product id', async () => {
    const expected = [{ id: 'att-1' }];
    mockService.getAttestationsByProduct.mockResolvedValue(expected);

    const result = await controller.getByProduct('prod-1');
    expect(verifiersService.getAttestationsByProduct).toHaveBeenCalledWith('prod-1');
    expect(result).toEqual(expected);
  });
});
