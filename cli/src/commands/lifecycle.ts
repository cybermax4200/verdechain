import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table';

function getClient(options: any) {
  return axios.create({ baseURL: options.apiUrl || 'http://localhost:3000' });
}

export const lifecycleCommand = new Command('lifecycle')
  .description('Manage lifecycle events')
  .option('--api-url <url>', 'API base URL')
  .option('--format <format>', 'Output format');

lifecycleCommand
  .command('list <product-id>')
  .description('List lifecycle events for a product')
  .action(async (productId, _options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = _options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get(`/products/${productId}/lifecycle`);

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const events = Array.isArray(data) ? data : [];
        if (events.length === 0) {
          console.log(chalk.yellow('No lifecycle events found for this product.'));
          return;
        }

        const table = new Table({
          head: ['#', 'Stage', 'Date', 'Description', 'Emissions (kg)'],
          style: { head: ['cyan'] },
        });

        events.forEach((event: any, index: number) => {
          table.push([
            String(index + 1),
            event.stage ?? '-',
            event.timestamp ? new Date(event.timestamp).toLocaleDateString() : '-',
            (event.description ?? '').slice(0, 40) || '-',
            event.emissionsKg !== undefined ? String(event.emissionsKg) : '-',
          ]);
        });

        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

lifecycleCommand
  .command('record <json-file>')
  .description('Record a lifecycle event (JSON file)')
  .action(async (jsonFile, _options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    try {
      const fs = await import('fs');
      const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      const client = getClient(globalOpts);
      const { data: event } = await client.post('/supply-chain/events', data);
      console.log(chalk.green('✓ Lifecycle event recorded:'), event.id);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });
