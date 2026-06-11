import { Module, Provider } from '@nestjs/common';
import { IpfsService, IpfsConfig } from './ipfs.service';

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    return '';
  }
  return value;
}

function createIpfsConfig(): IpfsConfig {
  return {
    pinataApiKey: getEnvOrThrow('PINATA_API_KEY'),
    pinataApiSecret: getEnvOrThrow('PINATA_API_SECRET'),
    pinataJwt: getEnvOrThrow('PINATA_JWT'),
    gatewayUrl: getEnvOrThrow('IPFS_GATEWAY') || 'https://gateway.pinata.cloud/ipfs',
  };
}

const ipfsProvider: Provider = {
  provide: IpfsService,
  useFactory: () => {
    return new IpfsService(createIpfsConfig());
  },
};

@Module({
  providers: [ipfsProvider],
  exports: [IpfsService],
})
export class IpfsModule {}
