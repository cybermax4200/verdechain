import { Module } from '@nestjs/common';
import { SupplyChainController } from './supply-chain.controller';
import { SupplyChainService } from './supply-chain.service';
import { AggregationService } from './aggregation.service';

@Module({
  controllers: [SupplyChainController],
  providers: [SupplyChainService, AggregationService],
  exports: [SupplyChainService, AggregationService],
})
export class SupplyChainModule {}
