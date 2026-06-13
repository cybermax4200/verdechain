import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import { CarbonService } from './carbon.service';
import { FootprintQueryDto, CompareQueryDto, UpdateFactorDto, UpdateGridIntensityDto } from './dto/footprint-query.dto';

@Controller('carbon')
export class CarbonController {
  constructor(private readonly carbonService: CarbonService) {}

  @Get('footprint/:productId')
  async getFootprint(
    @Param('productId') productId: string,
    @Query() query: FootprintQueryDto,
  ) {
    return this.carbonService.calculateFootprint(
      productId,
      query.methodology as any,
    );
  }

  @Get('breakdown/:productId')
  async getBreakdown(@Param('productId') productId: string) {
    return this.carbonService.getBreakdown(productId);
  }

  @Get('compare')
  async compare(@Query() query: CompareQueryDto) {
    const ids = query.ids.split(',').map((s) => s.trim());
    return this.carbonService.compare(ids);
  }

  @Get('factors')
  async getFactors(@Query('source') source?: 'ipcc' | 'epa') {
    return this.carbonService.getFactors(source);
  }

  @Post('factors')
  async updateFactor(@Body(ValidationPipe) _dto: UpdateFactorDto) {
    return { message: 'Factor updates are applied at the data source level' };
  }

  @Get('grid-intensity/:region')
  async getGridIntensity(@Param('region') region: string) {
    return this.carbonService.getGridIntensity(region);
  }

  @Get('grid-intensity')
  async getAllGridIntensities() {
    return this.carbonService.getAllGridIntensities();
  }

  @Post('grid-intensity')
  async updateGridIntensity(@Body(ValidationPipe) dto: UpdateGridIntensityDto) {
    return this.carbonService.updateGridIntensity(
      dto.region,
      dto.value,
      dto.unit,
      'admin',
    );
  }

  @Get('methodology')
  async getMethodology() {
    return this.carbonService.getMethodology();
  }

  @Get('equivalents')
  async getEquivalents(@Query('kg') kg: string) {
    const kgCO2e = parseFloat(kg);
    if (isNaN(kgCO2e)) {
      return { error: 'Invalid kg value' };
    }
    return this.carbonService.getEquivalents(kgCO2e);
  }
}
