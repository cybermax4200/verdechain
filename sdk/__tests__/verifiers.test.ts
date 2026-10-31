import { VerdeChainClient } from '../src/client';
import { VerifiersAPI, type RegisterVerifierData } from '../src/verifiers';

describe('VerifiersAPI', () => {
  const client = new VerdeChainClient({ apiUrl: 'http://test.api' });
  const verifiers = new VerifiersAPI(client);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getVerifiers', () => {
    it('should fetch list of verifiers', async () => {
      const mockVerifiers = [
        {
          id: 'ver-1',
          name: 'GreenCheck Global',
          publicKey: 'GABC123',
          stakeXlm: 5000,
          reputationScore: 92,
          status: 'ACTIVE' as const,
        },
      ];

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockVerifiers);

      const result = await verifiers.getVerifiers();
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/verifiers',
      });
      expect(result).toEqual(mockVerifiers);
    });
  });

  describe('getVerifier', () => {
    it('should fetch single verifier by ID', async () => {
      const mockVerifier = {
        id: 'ver-1',
        name: 'GreenCheck Global',
        publicKey: 'GABC123',
        stakeXlm: 5000,
        reputationScore: 92,
        status: 'ACTIVE' as const,
      };

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockVerifier);

      const result = await verifiers.getVerifier('ver-1');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/verifiers/ver-1',
      });
      expect(result).toEqual(mockVerifier);
    });
  });

  describe('registerVerifier', () => {
    it('should post verifier registration', async () => {
      const registerData: RegisterVerifierData = {
        name: 'EcoCert Labs',
        publicKey: 'GDEF456',
        email: 'contact@ecocert.example',
      };

      const mockResponse = {
        id: 'ver-2',
        ...registerData,
        stakeXlm: 0,
        reputationScore: 0,
        status: 'ACTIVE' as const,
      };

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockResponse);

      const result = await verifiers.registerVerifier(registerData);
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: '/verifiers/register',
        data: registerData,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('addStake', () => {
    it('should send stake update request', async () => {
      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue({
        stake: '10000',
      });

      const result = await verifiers.addStake('ver-1', '5000');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/verifiers/ver-1/stake',
        data: { amount: '5000' },
      });
      expect(result.stake).toBe('10000');
    });
  });

  describe('getPendingAttestations', () => {
    it('should fetch pending attestations for verification', async () => {
      const mockAttestations = [
        {
          id: 'att-1',
          productId: 'prod-1',
          verifierId: 'ver-1',
          status: 'PENDING' as const,
          submittedAt: '2024-01-05T00:00:00.000Z',
        },
      ];

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockAttestations);

      const result = await verifiers.getPendingAttestations();
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/verifiers/pending',
      });
      expect(result).toEqual(mockAttestations);
    });
  });

  describe('heartbeat', () => {
    it('should send heartbeat ping', async () => {
      const mockResult = {
        status: 'OK',
        timestamp: '2024-01-05T12:00:00.000Z',
      };

      const requestSpy = jest.spyOn(client, 'request').mockResolvedValue(mockResult);

      const result = await verifiers.heartbeat('ver-1');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: '/verifiers/ver-1/heartbeat',
      });
      expect(result).toEqual(mockResult);
    });
  });
});
