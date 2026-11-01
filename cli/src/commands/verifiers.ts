import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table';

function getClient(options: any) {
  return axios.create({ baseURL: options.apiUrl || 'http://localhost:3000' });
}

export function formatVerifiers(verifiers: any[], format: string): string {
  if (format === 'json') {
    return JSON.stringify(verifiers, null, 2);
  }

  const table = new Table({
    head: ['ID', 'Name', 'Public Key', 'Stake (XLM)', 'Status', 'Reputation'],
    style: { head: ['cyan'] },
  });

  verifiers.forEach((v: any) => {
    table.push([
      v.id?.slice(0, 8) ?? '-',
      v.name ?? '-',
      v.publicKey ? `${v.publicKey.slice(0, 8)}...` : '-',
      v.stake !== undefined ? String(v.stake) : '-',
      v.status ?? '-',
      v.reputationScore !== undefined ? String(v.reputationScore) : '-',
    ]);
  });

  return table.toString();
}

export const verifiersCommand = new Command('verifiers')
  .description('Manage verifiers')
  .option('--api-url <url>', 'API base URL')
  .option('--format <format>', 'Output format');

verifiersCommand
  .command('list')
  .description('List all verifiers')
  .action(async (options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get('/verifiers');
      const list = Array.isArray(data) ? data : (data.data ?? []);
      console.log(formatVerifiers(list, format));
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

verifiersCommand
  .command('get <id>')
  .description('Get verifier profile')
  .action(async (id, options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get(`/verifiers/${id}`);

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const table = new Table({ style: { head: ['cyan'] } });
        table.push(['ID', data.id ?? '-']);
        table.push(['Name', data.name ?? '-']);
        table.push(['Public Key', data.publicKey ?? '-']);
        table.push(['Email', data.email ?? '-']);
        table.push(['Stake', data.stake !== undefined ? `${data.stake} XLM` : '-']);
        table.push(['Status', data.status ?? '-']);
        table.push([
          'Reputation Score',
          data.reputationScore !== undefined ? String(data.reputationScore) : '-',
        ]);
        table.push([
          'Total Attestations',
          data.totalAttestations !== undefined ? String(data.totalAttestations) : '-',
        ]);
        table.push([
          'Last Active',
          data.lastActiveAt ? new Date(data.lastActiveAt).toLocaleDateString() : '-',
        ]);
        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

verifiersCommand
  .command('register <json-file>')
  .description('Register a new verifier (JSON file)')
  .action(async (jsonFile, _options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    try {
      const fs = await import('fs');
      const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      const client = getClient(globalOpts);
      const { data: verifier } = await client.post('/verifiers/register', data);
      console.log(chalk.green('✓ Verifier registered:'), verifier.id);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

verifiersCommand
  .command('stake <id> <amount>')
  .description('Add stake to a verifier')
  .action(async (id, amount, _options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    try {
      const client = getClient(globalOpts);
      const { data } = await client.put(`/verifiers/${id}/stake`, {
        amount: Number(amount),
      });
      console.log(
        chalk.green(`✓ Stake updated for verifier ${id}:`),
        data.stake !== undefined ? `${data.stake} XLM` : `${amount} XLM`,
      );
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

verifiersCommand
  .command('pending')
  .description('View pending attestations')
  .option('-v, --verifier-id <id>', 'Verifier ID')
  .action(async (options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get('/verifiers/pending', {
        data: options.verifierId ? { verifierId: options.verifierId } : undefined,
      });

      const list = Array.isArray(data) ? data : [];
      if (format === 'json') {
        console.log(JSON.stringify(list, null, 2));
      } else {
        if (list.length === 0) {
          console.log(chalk.yellow('No pending attestations found.'));
          return;
        }

        const table = new Table({
          head: ['ID', 'Product ID', 'Status', 'Timestamp'],
          style: { head: ['cyan'] },
        });

        list.forEach((item: any) => {
          table.push([
            item.id?.slice(0, 8) ?? '-',
            item.productId?.slice(0, 8) ?? '-',
            item.status ?? '-',
            item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
          ]);
        });

        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });
