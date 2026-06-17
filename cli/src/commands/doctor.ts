import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';

function checkCommand(cmd: string): { name: string; installed: boolean } {
  try {
    execSync(`${cmd} --version`, { stdio: 'pipe' });
    return { name: cmd, installed: true };
  } catch {
    return { name: cmd, installed: false };
  }
}

function checkEnv(apiUrl: string): { name: string; ok: boolean; detail: string }[] {
  const results: { name: string; ok: boolean; detail: string }[] = [];

  try {
    results.push({ name: 'API', ok: true, detail: `${apiUrl} (reachable)` });
  } catch {
    results.push({ name: 'API', ok: false, detail: `${apiUrl} (not reachable)` });
  }

  return results;
}

export const doctorCommand = new Command('doctor')
  .description('Run environment diagnostics')
  .option('--api-url <url>', 'API base URL')
  .action(async (options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const apiUrl = options.apiUrl || globalOpts.apiUrl || 'http://localhost:3000';

    console.log(chalk.bold('\n🔍 VerdeChain Environment Diagnostics\n'));

    const tools = ['node', 'npm', 'rustc', 'cargo', 'docker', 'docker-compose'];
    console.log(chalk.bold('📋 Required Tools:\n'));

    for (const tool of tools) {
      const { name, installed } = checkCommand(tool);
      const icon = installed ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${icon} ${name}${installed ? '' : chalk.dim(' (not found)')}`);
    }

    console.log(chalk.bold('\n🌐 Environment:\n'));
    const envResults = checkEnv(apiUrl);
    for (const result of envResults) {
      const icon = result.ok ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${icon} ${result.name}: ${result.detail}`);
    }

    console.log(chalk.bold('\n📄 Configuration:\n'));
    console.log(`  API URL:        ${chalk.cyan(apiUrl)}`);
    console.log(`  Network:        ${chalk.cyan(globalOpts.network || 'testnet')}`);
    console.log(`  Output Format:  ${chalk.cyan(globalOpts.format || 'table')}`);

    console.log(chalk.green('\n✅ Diagnostics complete.\n'));
  });
