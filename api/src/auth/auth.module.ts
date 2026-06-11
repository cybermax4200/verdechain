import { Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Sep10Strategy, Sep10Config } from './strategies/sep10.strategy';
import { PrismaService } from '../prisma/prisma.service';

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    return '';
  }
  return value;
}

function createSep10Config(): Sep10Config {
  return {
    signingKey: getEnvOrThrow('SEP10_SIGNING_KEY'),
    homeDomain: getEnvOrThrow('SEP10_HOME_DOMAIN'),
    networkPassphrase: getEnvOrThrow('STELLAR_NETWORK_PASSPHRASE'),
  };
}

const jwtSecret = getEnvOrThrow('JWT_SECRET');
const jwtExpiry = getEnvOrThrow('JWT_EXPIRY') || '24h';

const sep10Provider: Provider = {
  provide: Sep10Strategy,
  useFactory: () => {
    return new Sep10Strategy(createSep10Config());
  },
};

const jwtStrategyProvider: Provider = {
  provide: JwtStrategy,
  useFactory: (prisma: PrismaService) => {
    return new JwtStrategy(prisma, jwtSecret);
  },
  inject: [PrismaService],
};

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: jwtExpiry },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, sep10Provider, jwtStrategyProvider],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
