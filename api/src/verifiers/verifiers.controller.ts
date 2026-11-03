import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { VerifiersService } from './verifiers.service';
import { RegisterVerifierDto } from './dto/register-verifier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('verifiers')
export class VerifiersController {
  constructor(private readonly verifiersService: VerifiersService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async register(@Body(ValidationPipe) dto: RegisterVerifierDto) {
    return this.verifiersService.register(dto);
  }

  @Get()
  async findAll() {
    return this.verifiersService.findAll();
  }

  @Get('pending')
  async getPendingAttestations(@Query('verifierId') verifierId?: string) {
    return this.verifiersService.getPendingAttestations(verifierId);
  }

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.verifiersService.getProfile(id);
  }

  @Put(':id/stake')
  @UseGuards(JwtAuthGuard)
  async addStake(@Param('id') id: string, @Body('amount') amount: number) {
    return this.verifiersService.addStake(id, amount);
  }

  @Post(':id/heartbeat')
  @UseGuards(JwtAuthGuard)
  async heartbeat(@Param('id') id: string) {
    return this.verifiersService.heartbeat(id);
  }
}
