import { VerdeChainClient } from '../src/client';

describe('VerdeChainClient', () => {
  it('should create a client with default config', () => {
    const client = new VerdeChainClient();
    expect(client.config.apiUrl).toBe('http://localhost:3000');
    expect(client.config.networkPassphrase).toBe('Test SDF Network ; September 2015');
  });

  it('should create a client with custom config', () => {
    const client = new VerdeChainClient({
      apiUrl: 'https://api.verdechain.io',
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    });
    expect(client.config.apiUrl).toBe('https://api.verdechain.io');
    expect(client.config.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
  });

  it('should throw if apiUrl is empty', () => {
    expect(() => new VerdeChainClient({ apiUrl: '' })).toThrow();
  });

  it('should manage auth tokens', () => {
    const client = new VerdeChainClient();
    expect(client.getAuthToken()).toBeNull();
    client.setAuthToken('test-token');
    expect(client.getAuthToken()).toBe('test-token');
    client.setAuthToken(null);
    expect(client.getAuthToken()).toBeNull();
  });
});
