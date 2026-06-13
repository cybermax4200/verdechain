import { IsOptional, IsString, IsNumber } from 'class-validator';

export class FootprintQueryDto {
  @IsOptional()
  @IsString()
  methodology?: string;
}

export class CompareQueryDto {
  @IsString()
  ids!: string;
}

export class UpdateFactorDto {
  @IsString()
  key!: string;

  @IsString()
  stage!: string;

  @IsNumber()
  value!: number;

  @IsString()
  unit!: string;

  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateGridIntensityDto {
  @IsString()
  region!: string;

  @IsNumber()
  value!: number;

  @IsString()
  unit!: string;
}
