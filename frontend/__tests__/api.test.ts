import MockAdapter from 'axios-mock-adapter';
import { api } from '../lib/api';

describe('Frontend ApiClient', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter((api as any).client);
    api.setAuthToken(null);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('auth handling and interceptors', () => {
    it('should attach Authorization header when authToken is set', async () => {
      api.setAuthToken('test-jwt-token');

      mock.onGet('/products').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer test-jwt-token');
        return [200, { data: [], total: 0 }];
      });

      await api.getProducts();
    });

    it('should clear authToken when API responds with 401 Unauthorized', async () => {
      api.setAuthToken('expired-token');

      mock.onGet('/products/secure').reply(401);

      await expect(api.getProduct('secure')).rejects.toThrow();
      expect((api as any).authToken).toBeNull();
    });
  });

  describe('products and provenance methods', () => {
    it('should call getProducts with query parameters', async () => {
      mock.onGet('/products').reply((config) => {
        expect(config.params).toEqual({
          q: 'shirt',
          type: 'Apparel',
          origin: 'PT',
          sort: 'createdAt:desc',
          page: '1',
          limit: '10',
        });
        return [
          200,
          {
            data: [{ id: 'prod-1' }],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        ];
      });

      const result = await api.getProducts({
        q: 'shirt',
        type: 'Apparel',
        origin: 'PT',
        sort: 'createdAt:desc',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should call getProduct by ID', async () => {
      mock.onGet('/products/prod-1').reply(200, { id: 'prod-1', name: 'Coffee' });

      const result = await api.getProduct('prod-1');
      expect(result.name).toBe('Coffee');
    });

    it('should call getProvenance by product ID', async () => {
      mock.onGet('/products/prod-1/provenance').reply(200, {
        nodes: [{ id: 'node-1' }],
        edges: [],
      });

      const result = await api.getProvenance('prod-1');
      expect(result.nodes).toHaveLength(1);
    });

    it('should call getLifecycle events for product', async () => {
      mock.onGet('/products/prod-1/lifecycle').reply(200, [{ id: 'evt-1', stage: 'HARVEST' }]);

      const result = await api.getLifecycle('prod-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('carbon and certificates methods', () => {
    it('should get carbon records and calculate footprint', async () => {
      mock.onGet('/products/prod-1/carbon').reply(200, [{ totalFootprint: 12.5 }]);
      mock.onGet('/carbon/footprint/prod-1').reply(200, {
        scope1: 2.1,
        scope2: 1.4,
        scope3: 5.0,
        totalFootprint: 8.5,
        methodology: 'GHG Protocol',
      });

      const carbonList = await api.getCarbonFootprint('prod-1');
      expect(carbonList[0].totalFootprint).toBe(12.5);

      const calculated = await api.calculateFootprint('prod-1');
      expect(calculated.totalFootprint).toBe(8.5);
      expect(calculated.methodology).toBe('GHG Protocol');
    });

    it('should query certificates with filters', async () => {
      mock.onGet('/certificates').reply((config) => {
        expect(config.params).toEqual({
          type: 'ORGANIC',
          status: 'active',
          page: '2',
          limit: '5',
        });
        return [200, { data: [{ id: 'cert-1' }], total: 1 }];
      });

      const result = await api.getCertificates({
        type: 'ORGANIC',
        status: 'active',
        page: 2,
        limit: 5,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should get certificate details and certificates by product', async () => {
      mock.onGet('/certificates/cert-1').reply(200, { id: 'cert-1', title: 'Fair Trade' });
      mock.onGet('/certificates/product/prod-1').reply(200, [{ id: 'cert-1' }]);

      const cert = await api.getCertificate('cert-1');
      expect(cert.title).toBe('Fair Trade');

      const productCerts = await api.getCertificatesByProduct('prod-1');
      expect(productCerts).toHaveLength(1);
    });
  });

  describe('verifiers and webhooks methods', () => {
    it('should fetch verifiers list', async () => {
      mock.onGet('/verifiers').reply(200, [{ id: 'v-1', name: 'EcoCert' }]);

      const verifiers = await api.getVerifiers();
      expect(verifiers).toHaveLength(1);
      expect(verifiers[0].name).toBe('EcoCert');
    });

    it('should post webhook registration', async () => {
      mock.onPost('/webhooks').reply((config) => {
        const body = JSON.parse(config.data);
        expect(body.url).toBe('https://example.com/webhook');
        expect(body.events).toEqual(['product.created']);
        expect(body.secret).toBe('secret123');
        return [201, { id: 'wh-1' }];
      });

      const res = await api.registerWebhook(
        'https://example.com/webhook',
        ['product.created'],
        'secret123',
      );
      expect(res.id).toBe('wh-1');
    });
  });
});
