import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VerifiersService } from './verifiers.service';

@ApiTags('attestations')
@Controller('attestations')
export class AttestationsController {
  constructor(private readonly verifiersService: VerifiersService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit product for verifier attestation' })
  @ApiResponse({ status: 201, description: 'Attestation requested' })
  async submit(@Body() body: { productId: string; evidence?: any; threshold?: number }) {
    return this.verifiersService.submitAttestation(body.productId, body.evidence, body.threshold);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve an attestation' })
  @ApiResponse({ status: 200, description: 'Attestation approval recorded' })
  async approve(@Param('id') id: string, @Body('verifierId') verifierId?: string) {
    return this.verifiersService.approveAttestation(id, verifierId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject an attestation' })
  @ApiResponse({ status: 200, description: 'Attestation rejected' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Body('verifierId') verifierId?: string,
  ) {
    return this.verifiersService.rejectAttestation(id, reason, verifierId);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate an attestation to require higher quorum' })
  @ApiResponse({ status: 200, description: 'Attestation escalated' })
  async escalate(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Body('verifierId') verifierId?: string,
  ) {
    return this.verifiersService.escalateAttestation(id, reason, verifierId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attestation details by ID' })
  @ApiResponse({ status: 200, description: 'Attestation found' })
  async getOne(@Param('id') id: string) {
    return this.verifiersService.getAttestation(id);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all attestations for a product' })
  @ApiResponse({ status: 200, description: 'Product attestations' })
  async getByProduct(@Param('productId') productId: string) {
    return this.verifiersService.getAttestationsByProduct(productId);
  }
}
