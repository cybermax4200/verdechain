import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsString } from 'class-validator';

export class ChallengeDto {
  @IsString()
  publicKey!: string;
}

export class VerifyDto {
  @IsString()
  signedXdr!: string;
}

export class RefreshDto {
  @IsString()
  token!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate SEP-10 challenge transaction' })
  @ApiBody({ type: ChallengeDto })
  async challenge(@Body(ValidationPipe) dto: ChallengeDto) {
    return this.authService.challenge(dto.publicKey);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify signed challenge and receive JWT' })
  @ApiBody({ type: VerifyDto })
  async verify(@Body(ValidationPipe) dto: VerifyDto) {
    return this.authService.verify(dto.signedXdr);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh an existing JWT token' })
  @ApiBody({ type: RefreshDto })
  async refresh(@Body(ValidationPipe) dto: RefreshDto) {
    return this.authService.refresh(dto.token);
  }
}
