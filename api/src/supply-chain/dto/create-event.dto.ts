import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  IsObject,
  IsEnum,
} from 'class-validator';

export enum LifecycleStage {
  RAW_MATERIAL_EXTRACTION = 'RAW_MATERIAL_EXTRACTION',
  TRANSPORT_TO_SUPPLIER = 'TRANSPORT_TO_SUPPLIER',
  MANUFACTURING = 'MANUFACTURING',
  TRANSPORT_TO_DISTRIBUTOR = 'TRANSPORT_TO_DISTRIBUTOR',
  DISTRIBUTION = 'DISTRIBUTION',
  RETAIL = 'RETAIL',
  USE = 'USE',
  END_OF_LIFE = 'END_OF_LIFE',
}

export class CreateEventDto {
  @IsString()
  productId!: string;

  @IsEnum(LifecycleStage)
  stage!: LifecycleStage;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  energyKwh?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelUsed?: number;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wasteKg?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
