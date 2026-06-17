import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table';

function getClient(options: any) {
  return axios.create({ baseURL: options.apiUrl || 'http://localhost:3000' });
}

export const carbonCommand = new Command('carbon')
  .description('Carbon footprint commands')
  .option('--api-url <url>', 'API base URL')
  .option('--format <format>', 'Output format');

carbonCommand
  .command('footprint <product-id>')
  .description('Get carbon footprint for a product')
  .action(async (productId, options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get(`/carbon/footprint/${productId}`);

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const table = new Table({ style: { head: ['cyan'] } });
        table.push(['Total Footprint', `${(data.totalFootprint ?? 0).toFixed(2)} kg CO₂e`]);
        table.push(['Scope 1 (Direct)', `${(data.scope1 ?? 0).toFixed(2)} kg`]);
        table.push(['Scope 2 (Energy)', `${(data.scope2 ?? 0).toFixed(2)} kg`]);
        table.push(['Scope 3 (Supply Chain)', `${(data.scope3 ?? 0).toFixed(2)} kg`]);
        table.push(['Confidence', `${data.confidenceScore ?? 'N/A'}%`]);
        table.push(['Methodology', data.methodology ?? 'N/A']);
        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

carbonCommand
  .command('factors')
  .description('List emission factors')
  .action(async (options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get('/carbon/factors');

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const factors = typeof data === 'object' ? data : {};
        const table = new Table({
          head: ['Factor', 'Value'],
          style: { head: ['cyan'] },
        });

        Object.entries(factors).forEach(([key, value]) => {
          table.push([key, String(value)]);
        });

        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

carbonCommand
  .command('grid-intensity <region>')
  .description('Get grid intensity for a region')
  .action(async (region, options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get(`/carbon/grid-intensity/${region}`);

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const table = new Table({ style: { head: ['cyan'] } });
        table.push(['Region', data.region ?? region]);
        table.push(['Intensity', `${data.intensity} gCO₂e/kWh`]);
        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });
