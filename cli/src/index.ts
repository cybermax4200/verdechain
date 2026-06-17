#!/usr/bin/env node

import { Command } from 'commander';
import { productsCommand } from './commands/products';
import { lifecycleCommand } from './commands/lifecycle';
import { carbonCommand } from './commands/carbon';
import { certificatesCommand } from './commands/certificates';
import { verifiersCommand } from './commands/verifiers';
import { doctorCommand } from './commands/doctor';

const program = new Command();

program
  .name('verdechain')
  .description('VerdeChain CLI — Product provenance and carbon accounting on Stellar')
  .version('1.0.0');

program
  .option('--api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--network <network>', 'Stellar network (testnet/mainnet)', 'testnet')
  .option('--format <format>', 'Output format (table/json)', 'table');

program.addCommand(productsCommand);
program.addCommand(lifecycleCommand);
program.addCommand(carbonCommand);
program.addCommand(certificatesCommand);
program.addCommand(verifiersCommand);
program.addCommand(doctorCommand);

program.parse(process.argv);
