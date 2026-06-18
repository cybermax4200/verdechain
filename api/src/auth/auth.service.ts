import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Sep10Strategy } from './strategies/sep10.strategy';
import { JwtPayload } from './strategies/jwt.strategy';

export interface ChallengeResponse {
  challengeXdr: string;
  serverPublicKey: string;
}

export interface VerifyResponse {
  jwt: string;
  expiresIn: string;
}

export interface RefreshResponse {
  jwt: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly defaultExpiry = '24h';

  constructor(
    private readonly sep10Strategy: Sep10Strategy,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async challenge(publicKey: string): Promise<ChallengeResponse> {
    const { transactionXdr } = this.sep10Strategy.generateChallenge(publicKey);

    await this.ensureUserExists(publicKey);

    return {
      challengeXdr: transactionXdr,
      serverPublicKey: this.sep10Strategy.getServerPublicKey(),
    };
  }

  async verify(signedXdr: string): Promise<VerifyResponse> {
    const { publicKey, valid } = this.sep10Strategy.verifyChallenge(signedXdr);

    if (!valid) {
      throw new UnauthorizedException('Invalid challenge signature');
    }

    const user = await this.ensureUserExists(publicKey);

    const payload: JwtPayload = {
      sub: publicKey,
      roles: user.roles,
    };

    const jwt = this.jwtService.sign(payload, {
      expiresIn: this.defaultExpiry,
    });

    return {
      jwt,
      expiresIn: this.defaultExpiry,
    };
  }

  async refresh(token: string): Promise<RefreshResponse> {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);

      const user = await this.prisma.user.findUnique({
        where: { publicKey: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload: JwtPayload = {
        sub: decoded.sub,
        roles: user.roles,
      };

      const jwt = this.jwtService.sign(payload, {
        expiresIn: this.defaultExpiry,
      });

      return {
        jwt,
        expiresIn: this.defaultExpiry,
      };
    } catch (error) {
      this.logger.error(
        `Token refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async ensureUserExists(publicKey: string) {
    let user = await this.prisma.user.findUnique({
      where: { publicKey },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          publicKey,
          roles: ['user'],
        },
      });
      this.logger.log(`Created new user for public key: ${publicKey}`);
    }

    return user;
  }
}
