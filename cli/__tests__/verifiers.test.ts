import { formatVerifiers, verifiersCommand } from '../src/commands/verifiers';

describe('verifiers command', () => {
  const sampleVerifiers = [
    {
      id: 'ver-12345678-abcd',
      name: 'EcoCert Labs',
      publicKey: 'GBRPYHIL2CI3FNQ4AFJMFKUBGGBU5RP6GTRN',
      stake: 5000,
      status: 'active',
      reputationScore: 98,
    },
  ];

  describe('formatVerifiers', () => {
    it('should format verifiers as JSON when format is json', () => {
      const output = formatVerifiers(sampleVerifiers, 'json');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual(sampleVerifiers);
    });

    it('should format verifiers as an ASCII table when format is table', () => {
      const output = formatVerifiers(sampleVerifiers, 'table');
      expect(output).toContain('EcoCert Labs');
      expect(output).toContain('5000');
      expect(output).toContain('ver-123');
      expect(output).toContain('GBRPYHIL');
      expect(output).toContain('98');
    });

    it('should handle empty or null fields gracefully', () => {
      const output = formatVerifiers([{}], 'table');
      expect(output).toContain('-');
    });
  });

  describe('verifiersCommand definitions', () => {
    it('should configure all expected subcommands', () => {
      const subcommands = verifiersCommand.commands.map((c) => c.name());
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('get');
      expect(subcommands).toContain('register');
      expect(subcommands).toContain('stake');
      expect(subcommands).toContain('pending');
    });
  });
});
