import { Global, Module, Provider } from '@nestjs/common';
import { SorobanClientService } from './soroban-client';
import { HorizonClientService } from './horizon-client';
import { WalletService } from './wallet';
import { StellarService, ContractAddresses } from './stellar.service';

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    return '';
  }
  return value;
}

function createContractAddresses(): ContractAddresses {
  return {
    productRegistry: getEnvOrThrow('CONTRACT_PRODUCT_REGISTRY'),
    lifecycleTracker: getEnvOrThrow('CONTRACT_LIFECYCLE_TRACKER'),
    attestation: getEnvOrThrow('CONTRACT_ATTESTATION'),
    greenTagCert: getEnvOrThrow('CONTRACT_GREENTAG_CERT'),
    verifierRegistry: getEnvOrThrow('CONTRACT_VERIFIER_REGISTRY'),
    carbonOracle: getEnvOrThrow('CONTRACT_CARBON_ORACLE'),
  };
}

const stellarProviders: Provider[] = [
  {
    provide: SorobanClientService,
    useFactory: () => {
      return new SorobanClientService({
        rpcUrl: getEnvOrThrow('STELLAR_SOROBAN_RPC'),
        networkPassphrase: getEnvOrThrow('STELLAR_NETWORK_PASSPHRASE'),
        adminSecretKey: getEnvOrThrow('STELLAR_ADMIN_SECRET_KEY'),
      });
    },
  },
  {
    provide: HorizonClientService,
    useFactory: () => {
      return new HorizonClientService({
        horizonUrl: getEnvOrThrow('STELLAR_HORIZON_URL'),
        networkPassphrase: getEnvOrThrow('STELLAR_NETWORK_PASSPHRASE'),
      });
    },
  },
  {
    provide: WalletService,
    useFactory: () => {
      return new WalletService({
        horizonUrl: getEnvOrThrow('STELLAR_HORIZON_URL'),
        networkPassphrase: getEnvOrThrow('STELLAR_NETWORK_PASSPHRASE'),
      });
    },
  },
  {
    provide: StellarService,
    useFactory: (sorobanClient: SorobanClientService) => {
      return new StellarService(sorobanClient, createContractAddresses());
    },
    inject: [SorobanClientService],
  },
];

@Global()
@Module({
  providers: stellarProviders,
  exports: [StellarService, SorobanClientService, HorizonClientService, WalletService],
})
export class StellarModule {}
