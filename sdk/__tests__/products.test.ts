import { VerdeChainClient } from '../src/client';
import { ProductsAPI } from '../src/products';

describe('ProductsAPI', () => {
  const client = new VerdeChainClient({ apiUrl: 'http://test.api' });
  const products = new ProductsAPI(client);

  describe('getProducts', () => {
    it('should build correct query params', async () => {
      const requestSpy = jest.spyOn(client, 'request');
      requestSpy.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });

      await products.getProducts({ q: 'test', type: 'apparel', page: 1, limit: 10 });

      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/products',
        params: { q: 'test', type: 'apparel', page: '1', limit: '10' },
      });

      requestSpy.mockRestore();
    });

    it('should omit undefined filters', async () => {
      const requestSpy = jest.spyOn(client, 'request');
      requestSpy.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

      await products.getProducts({ limit: 20 });

      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/products',
        params: { limit: '20' },
      });

      requestSpy.mockRestore();
    });

    it('should return paginated response', async () => {
      const mockResponse = {
        data: [{ id: '1', name: 'Test Product' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      const requestSpy = jest.spyOn(client, 'request');
      requestSpy.mockResolvedValue(mockResponse);

      const result = await products.getProducts();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);

      requestSpy.mockRestore();
    });
  });

  describe('getProduct', () => {
    it('should fetch a single product by id', async () => {
      const mockProduct = { id: '123', name: 'Test' };
      const requestSpy = jest.spyOn(client, 'request');
      requestSpy.mockResolvedValue(mockProduct);

      const result = await products.getProduct('123');
      expect(result.id).toBe('123');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        url: '/products/123',
      });

      requestSpy.mockRestore();
    });
  });

  describe('registerProduct', () => {
    it('should send POST with product data', async () => {
      const mockData = { name: 'New Product', manufacturerPublicKey: 'GABCD...' };
      const mockResponse = { id: '1', ...mockData };
      const requestSpy = jest.spyOn(client, 'request');
      requestSpy.mockResolvedValue(mockResponse);

      const result = await products.registerProduct(mockData as any);
      expect(result.name).toBe('New Product');
      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: '/products',
        data: mockData,
      });

      requestSpy.mockRestore();
    });
  });
});
