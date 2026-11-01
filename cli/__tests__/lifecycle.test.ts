import { lifecycleCommand } from '../src/commands/lifecycle';

describe('lifecycle command definitions', () => {
  it('should configure list and record subcommands', () => {
    const subcommands = lifecycleCommand.commands.map((c) => c.name());
    expect(subcommands).toContain('list');
    expect(subcommands).toContain('record');
  });

  it('should have correct description', () => {
    expect(lifecycleCommand.description()).toBe('Manage lifecycle events');
  });
});
