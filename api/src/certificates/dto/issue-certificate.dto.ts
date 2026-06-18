import { IsString, IsOptional, IsDateString, IsObject, IsEnum } from 'class-validator';

export enum CertType {
  GREEN_TAG = 'GREEN_TAG',
  CARBON_NEUTRAL = 'CARBON_NEUTRAL',
  ORGANIC = 'ORGANIC',
  FAIR_TRADE = 'FAIR_TRADE',
  RECYCLED = 'RECYCLED',
  ENERGY_STAR = 'ENERGY_STAR',
}

export class IssueCertificateDto {
  @IsString()
  productId!: string;

  @IsEnum(CertType)
  certType!: CertType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  issuerId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
