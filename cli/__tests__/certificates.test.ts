import { formatCertificates, certificatesCommand } from '../src/commands/certificates';

describe('certificates command', () => {
  const sampleCertificates = [
    {
      id: 'cert-12345678-abcd',
      title: 'Fair Trade Organic',
      productId: 'prod-87654321-efgh',
      certType: 'ORGANIC',
      status: 'active',
      issuedAt: '2026-05-01T00:00:00.000Z',
    },
  ];

  describe('formatCertificates', () => {
    it('should format certificates as JSON when format is json', () => {
      const output = formatCertificates(sampleCertificates, 'json');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual(sampleCertificates);
    });

    it('should format certificates as an ASCII table when format is table', () => {
      const output = formatCertificates(sampleCertificates, 'table');
      expect(output).toContain('Fair Trade Organic');
      expect(output).toContain('ORGANIC');
      expect(output).toContain('cert-123');
      expect(output).toContain('prod-876');
    });

    it('should handle empty or missing fields gracefully', () => {
      const output = formatCertificates([{}], 'table');
      expect(output).toContain('-');
    });
  });

  describe('certificatesCommand definitions', () => {
    it('should configure all expected subcommands', () => {
      const subcommands = certificatesCommand.commands.map((c) => c.name());
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('issue');
      expect(subcommands).toContain('revoke');
      expect(subcommands).toContain('verify');
    });
  });
});
