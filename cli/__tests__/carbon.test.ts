import { carbonCommand } from '../src/commands/carbon';

describe('carbon command definitions', () => {
  it('should configure footprint, factors, and grid-intensity subcommands', () => {
    const subcommands = carbonCommand.commands.map((c) => c.name());
    expect(subcommands).toContain('footprint');
    expect(subcommands).toContain('factors');
    expect(subcommands).toContain('grid-intensity');
  });

  it('should have correct description', () => {
    expect(carbonCommand.description()).toBe('Carbon footprint commands');
  });
});
