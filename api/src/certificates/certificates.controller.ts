import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ValidationPipe,
  Res,
  Header,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { QueryCertificateDto } from './dto/query-certificate.dto';
import { VerifyCertificateDto } from './dto/verify-certificate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async issue(@Body(ValidationPipe) dto: IssueCertificateDto) {
    return this.certificatesService.issue(dto);
  }

  @Get()
  async findAll(@Query(ValidationPipe) query: QueryCertificateDto) {
    return this.certificatesService.findAll(query);
  }

  @Get('product/:productId')
  async getByProduct(@Param('productId') productId: string) {
    return this.certificatesService.getCertificatesByProduct(productId);
  }

  @Post('verify')
  async verify(@Body(ValidationPipe) dto: VerifyCertificateDto) {
    const certId = dto.certificateId ?? dto.id;
    if (!certId) {
      throw new BadRequestException('Certificate ID is required');
    }
    return this.certificatesService.verify(certId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="certificate.pdf"')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.certificatesService.getCertificatePdf(id);
    res.send(pdfBuffer);
  }

  @Get(':id/preview')
  @Header('Content-Type', 'text/html')
  async getPreview(@Param('id') id: string) {
    return this.certificatesService.getHtmlPreview(id);
  }

  @Post(':id/revoke')
  @UseGuards(JwtAuthGuard)
  async revoke(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.certificatesService.revoke(id, reason ?? 'No reason provided');
  }
}
