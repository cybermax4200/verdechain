import { IsString, IsOptional, IsNumber, Min, IsEmail } from 'class-validator';

export class RegisterVerifierDto {
  @IsString()
  publicKey!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1000)
  stakeXlm!: number;
}
