import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  originCountry?: string;

  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @IsOptional()
  @IsString()
  manufacturerPublicKey?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
