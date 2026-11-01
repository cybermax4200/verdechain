import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table';

function getClient(options: any) {
  return axios.create({ baseURL: options.apiUrl || 'http://localhost:3000' });
}

export function formatCertificates(certificates: any[], format: string): string {
  if (format === 'json') {
    return JSON.stringify(certificates, null, 2);
  }

  const table = new Table({
    head: ['ID', 'Title', 'Product ID', 'Type', 'Status', 'Issued'],
    style: { head: ['cyan'] },
  });

  certificates.forEach((c: any) => {
    table.push([
      c.id?.slice(0, 8) ?? '-',
      c.title ?? '-',
      c.productId?.slice(0, 8) ?? '-',
      c.certType ?? '-',
      c.status ?? '-',
      c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '-',
    ]);
  });

  return table.toString();
}

export const certificatesCommand = new Command('certificates')
  .description('Manage certificates')
  .option('--api-url <url>', 'API base URL')
  .option('--format <format>', 'Output format');

certificatesCommand
  .command('list')
  .description('List all certificates')
  .option('-t, --type <type>', 'Filter by certificate type')
  .option('-s, --status <status>', 'Filter by status (active, revoked, expired)')
  .option('-p, --product-id <productId>', 'Filter by product ID')
  .option('-l, --limit <number>', 'Max results', '20')
  .action(async (options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const params: Record<string, string> = {};
      if (options.type) {
        params.type = options.type;
      }
      if (options.status) {
        params.status = options.status;
      }
      if (options.productId) {
        params.productId = options.productId;
      }
      if (options.limit) {
        params.limit = options.limit;
      }

      const { data } = await client.get('/certificates', { params });
      console.log(formatCertificates(data.data ?? data ?? [], format));
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

certificatesCommand
  .command('get <id>')
  .description('Get certificate details')
  .action(async (id, options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.get(`/certificates/${id}`);

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const table = new Table({ style: { head: ['cyan'] } });
        table.push(['ID', data.id ?? '-']);
        table.push(['Title', data.title ?? '-']);
        table.push(['Product ID', data.productId ?? '-']);
        table.push(['Type', data.certType ?? '-']);
        table.push(['Status', data.status ?? '-']);
        table.push(['Issuer ID', data.issuerId ?? '-']);
        table.push(['IPFS Hash', data.ipfsHash ?? '-']);
        table.push(['Issued', data.issuedAt ? new Date(data.issuedAt).toLocaleDateString() : '-']);
        table.push([
          'Expires',
          data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'Never',
        ]);
        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

certificatesCommand
  .command('issue <json-file>')
  .description('Issue a new certificate (JSON file)')
  .action(async (jsonFile, _options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    try {
      const fs = await import('fs');
      const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      const client = getClient(globalOpts);
      const { data: cert } = await client.post('/certificates', data);
      console.log(chalk.green('✓ Certificate issued:'), cert.id);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

certificatesCommand
  .command('revoke <id>')
  .description('Revoke a certificate')
  .option('-r, --reason <reason>', 'Revocation reason', 'No reason provided')
  .action(async (id, options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    try {
      const client = getClient(globalOpts);
      await client.post(`/certificates/${id}/revoke`, { reason: options.reason });
      console.log(chalk.green('✓ Certificate revoked:'), id);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });

certificatesCommand
  .command('verify <id>')
  .description('Verify a certificate validity')
  .action(async (id, options, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const format = options.format || globalOpts.format || 'table';
    try {
      const client = getClient(globalOpts);
      const { data } = await client.post('/certificates/verify', {
        certificateId: id,
        id,
      });

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        const table = new Table({ style: { head: ['cyan'] } });
        table.push(['Valid', data.valid ? chalk.green('YES') : chalk.red('NO')]);
        table.push(['Message', data.message ?? '-']);
        if (data.certificate) {
          table.push(['Certificate ID', data.certificate.id ?? id]);
          table.push(['Status', data.certificate.status ?? '-']);
          table.push(['Type', data.certificate.certType ?? '-']);
        }
        console.log(table.toString());
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.response?.data?.message ?? error.message);
      process.exit(1);
    }
  });
