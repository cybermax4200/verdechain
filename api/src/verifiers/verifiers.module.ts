import { Module } from '@nestjs/common';
import { VerifiersController } from './verifiers.controller';
import { VerifiersService } from './verifiers.service';
import { StakingService } from './staking.service';

@Module({
  controllers: [VerifiersController],
  providers: [VerifiersService, StakingService],
  exports: [VerifiersService, StakingService],
})
export class VerifiersModule {}
