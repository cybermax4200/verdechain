import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table';

function getClient(options: any) {
  return axios.create({ baseURL: options.apiUrl || 'http://localhost:3000' });
}

function formatProducts(products: any[], format: string) {
  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }

  const table = new Table({
    head: ['ID', 'Name', 'SKU', 'Type', 'Status', 'Origin'],
    style: { head: ['cyan'] },
  });

  products.forEach((p: any) => {
    table.push([
      p.id?.slice(0, 8) ?? '-',
      p.name ?? '-',
      p.sku ?? '-',
      p.productType ?? '-',
      p.status ?? '-',
      p.originCountry ?? '-',
    ]);
  });

  return table.toString();
}

export const productsCommand = new Command('products')
  .description('Manage products')
  .option('--api-url <url>', 'API base URL')
  .option('--format <format>', 'Output format');

productsCommand
  .command('list')
  .description('List all products')
  .option('-t, --type <type>', 'Filter by product type')
  .option('-o, --origin <country>', 'Filter by origin country')
  .option('-q, --query <search>', 'Search query')
  .option('-l, --limit <number>', 'Max results', '20')
  .action(async (options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const params: Record<string, string> = {};
      if (options.type) params.type = options.type;
      if (options.origin) params.origin = options.origin;
      if (options.query) params.q = options.query;
      if (options.limit) params.limit = options.limit;

      const { data } = await client.get('/products', { params });
      console.log(formatProducts(data.data ?? data ?? [], format));
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

productsCommand
  .command('get <id>')
  .description('Get product details')
  .action(async (id, options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get(`/products/${id}`);

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const table = new Table({ style: { head: ['cyan'] } });
        table.push(['Name', data.name ?? '-']);
        table.push(['SKU', data.sku ?? '-']);
        table.push(['Product Type', data.productType ?? '-']);
        table.push(['Origin', data.originCountry ?? '-']);
        table.push(['Status', data.status ?? '-']);
        table.push(['Manufacturer', data.manufacturer?.name ?? '-']);
        table.push(['Created', data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '-']);
        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

productsCommand
  .command('register <json-file>')
  .description('Register a new product (JSON file)')
  .action(async (jsonFile, _options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    try {
      const fs = await import('fs');
      const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      const client = getClient(globalOpts);
      const { data: product } = await client.post('/products', data);
      console.log(chalk.green('✓ Product registered:'), product.id);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });
