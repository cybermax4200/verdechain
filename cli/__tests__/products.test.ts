import { formatProducts, productsCommand } from '../src/commands/products';

describe('products command', () => {
  const sampleProducts = [
    {
      id: 'prod-12345678-abcd',
      name: 'Organic Cotton Shirt',
      sku: 'SKU-001',
      productType: 'Apparel',
      status: 'ACTIVE',
      originCountry: 'PT',
    },
  ];

  describe('formatProducts', () => {
    it('should format products as JSON when format is json', () => {
      const output = formatProducts(sampleProducts, 'json');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual(sampleProducts);
    });

    it('should format products as an ASCII table when format is table', () => {
      const output = formatProducts(sampleProducts, 'table');
      expect(output).toContain('Organic Cotton Shirt');
      expect(output).toContain('SKU-001');
      expect(output).toContain('prod-123'); // sliced ID
    });

    it('should handle empty or null fields gracefully', () => {
      const output = formatProducts([{}], 'table');
      expect(output).toContain('-');
    });
  });

  describe('productsCommand definitions', () => {
    it('should configure subcommands correctly', () => {
      const subcommands = productsCommand.commands.map((c) => c.name());
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('register');
    });
  });
});
