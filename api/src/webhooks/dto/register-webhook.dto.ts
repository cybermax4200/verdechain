import { IsString, IsArray, IsUrl, ArrayNotEmpty } from 'class-validator';

export class RegisterWebhookDto {
  @IsUrl()
  url!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events!: string[];

  @IsString()
  secret!: string;
}
