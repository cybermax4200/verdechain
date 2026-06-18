import { Controller, Get, Post, Put, Body, Param, ValidationPipe } from '@nestjs/common';
import { VerifiersService } from './verifiers.service';
import { RegisterVerifierDto } from './dto/register-verifier.dto';

@Controller('verifiers')
export class VerifiersController {
  constructor(private readonly verifiersService: VerifiersService) {}

  @Post('register')
  async register(@Body(ValidationPipe) dto: RegisterVerifierDto) {
    return this.verifiersService.register(dto);
  }

  @Get()
  async findAll() {
    return this.verifiersService.findAll();
  }

  @Get('pending')
  async getPendingAttestations(@Body('verifierId') verifierId: string) {
    return this.verifiersService.getPendingAttestations(verifierId);
  }

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.verifiersService.getProfile(id);
  }

  @Put(':id/stake')
  async addStake(@Param('id') id: string, @Body('amount') amount: number) {
    return this.verifiersService.addStake(id, amount);
  }

  @Post(':id/heartbeat')
  async heartbeat(@Param('id') id: string) {
    return this.verifiersService.heartbeat(id);
  }
}
