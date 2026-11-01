import { IsString, IsOptional } from 'class-validator';

export class VerifyCertificateDto {
  @IsOptional()
  @IsString()
  certificateId?: string;

  @IsOptional()
  @IsString()
  id?: string;
}
