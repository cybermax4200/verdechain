import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { SupplyChainService } from './supply-chain.service';
import { AggregationService } from './aggregation.service';
import { CreateEventDto } from './dto/create-event.dto';
import { BatchEventDto } from './dto/batch-event.dto';

@Controller('supply-chain')
export class SupplyChainController {
  constructor(
    private readonly supplyChainService: SupplyChainService,
    private readonly aggregationService: AggregationService,
  ) {}

  @Post('events')
  async recordEvent(@Body(ValidationPipe) dto: CreateEventDto) {
    return this.supplyChainService.recordEvent(dto);
  }

  @Post('events/batch')
  async batchRecord(@Body(ValidationPipe) dto: BatchEventDto) {
    return this.supplyChainService.batchRecord(dto.events);
  }

  @Get('timeline/:productId')
  async getTimeline(@Param('productId') productId: string) {
    return this.supplyChainService.getTimeline(productId);
  }

  @Get('participants/:productId')
  async getParticipants(@Param('productId') productId: string) {
    return this.supplyChainService.getParticipants(productId);
  }

  @Get('provenance/:productId')
  async getProvenance(@Param('productId') productId: string) {
    return this.aggregationService.buildProvenanceGraph(productId);
  }
}
