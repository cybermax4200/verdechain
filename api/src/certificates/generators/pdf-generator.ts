import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import * as fs from 'fs';

export interface CertificateData {
  id: string;
  title: string;
  certType: string;
  description?: string;
  productName: string;
  productSku?: string;
  productBatch?: string;
  manufacturerName: string;
  manufacturerCountry?: string;
  issuerName?: string;
  issuedAt: Date;
  expiresAt?: Date;
  certificateId: string;
  verificationUrl: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private readonly templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    const templatesDir = path.resolve(__dirname, '..', 'templates');
    const templateFiles = [
      'certificate-of-origin.hbs',
      'carbon-neutral.hbs',
      'organic.hbs',
    ];

    for (const file of templateFiles) {
      try {
        const filePath = path.join(templatesDir, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const templateName = file.replace('.hbs', '');
          this.templates.set(templateName, Handlebars.compile(content));
          this.logger.log(`Loaded template: ${templateName}`);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to load template ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  }

  async generateCertificate(certData: CertificateData): Promise<Buffer> {
    const templateName = this.mapCertTypeToTemplate(certData.certType);
    const template = this.templates.get(templateName);

    if (!template) {
      this.logger.warn(
        `Template not found for cert type ${certData.certType}, using default`,
      );
      const defaultTemplate = this.templates.get('certificate-of-origin');
      if (!defaultTemplate) {
        return this.generateFallbackHtml(certData);
      }
      return Buffer.from(defaultTemplate(certData));
    }

    const html = template(certData);
    return this.generatePdfFromHtml(html);
  }

  private mapCertTypeToTemplate(certType: string): string {
    const mapping: Record<string, string> = {
      GREEN_TAG: 'certificate-of-origin',
      CARBON_NEUTRAL: 'carbon-neutral',
      ORGANIC: 'organic',
      FAIR_TRADE: 'certificate-of-origin',
      RECYCLED: 'certificate-of-origin',
      ENERGY_STAR: 'certificate-of-origin',
    };
    return mapping[certType] ?? 'certificate-of-origin';
  }

  private async generatePdfFromHtml(html: string): Promise<Buffer> {
    try {
      let puppeteer: typeof import('puppeteer');
      try {
        puppeteer = await import('puppeteer');
      } catch {
        this.logger.warn('Puppeteer not available, returning HTML buffer');
        return Buffer.from(html);
      }

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' as any });

        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        });

        return Buffer.from(pdf);
      } finally {
        await browser.close();
      }
    } catch (error) {
      this.logger.error(
        `PDF generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Buffer.from(html);
    }
  }

  async embedXML(pdfBuffer: Buffer, xml: string): Promise<Buffer> {
    const pdfEnd = pdfBuffer.lastIndexOf('%%EOF');
    if (pdfEnd === -1) {
      return pdfBuffer;
    }

    const xmlStream = this.createEmbeddedXmlStream(xml);
    const updatedPdf = Buffer.concat([
      pdfBuffer.subarray(0, pdfEnd),
      Buffer.from(xmlStream),
      pdfBuffer.subarray(pdfEnd),
    ]);

    return updatedPdf;
  }

  private createEmbeddedXmlStream(xml: string): string {
    const streamContent = Buffer.from(xml).toString('base64');
    return [
      ' ',
      `${streamContent.length} 0 obj`,
      '<< /Type /EmbeddedFile /Subtype /text%2Fxml /Length ' +
        streamContent.length +
        ' >>',
      'stream',
      streamContent,
      'endstream',
      'endobj',
    ].join('\n');
  }

  private generateFallbackHtml(certData: CertificateData): Buffer {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${certData.title}</title></head>
<body style="font-family: Arial; padding: 40px;">
  <h1>${certData.title}</h1>
  <p>Type: ${certData.certType}</p>
  <p>Product: ${certData.productName}</p>
  <p>Issued: ${certData.issuedAt.toISOString()}</p>
  <p>ID: ${certData.certificateId}</p>
</body>
</html>`;
    return Buffer.from(html);
  }
}
