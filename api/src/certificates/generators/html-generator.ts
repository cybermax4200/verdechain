import { Injectable } from '@nestjs/common';

export interface CertificatePreviewData {
  id: string;
  title: string;
  certType: string;
  description?: string;
  productName: string;
  issuerName?: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: string;
  ipfsHash?: string;
}

@Injectable()
export class HtmlGeneratorService {
  generatePreview(data: CertificatePreviewData): string {
    const isActive = data.status === 'active';
    const statusColor = isActive ? '#16a34a' : '#dc2626';
    const statusIcon = isActive ? '✓' : '✗';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${this.escapeHtml(data.title)} - Certificate Preview</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0fdf4; display: flex; justify-content: center; padding: 40px 20px; }
  .certificate { max-width: 800px; width: 100%; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; border: 2px solid #bbf7d0; }
  .header { background: linear-gradient(135deg, #166534, #15803d); color: #fff; padding: 32px; text-align: center; }
  .header h1 { font-size: 28px; margin-bottom: 8px; }
  .header .type { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 16px; border-radius: 20px; font-size: 14px; }
  .body { padding: 32px; }
  .field { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
  .field:last-child { border-bottom: none; }
  .label { width: 140px; color: #6b7280; font-size: 14px; flex-shrink: 0; }
  .value { color: #111827; font-size: 15px; }
  .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; color: #fff; background: ${statusColor}; }
  .description { margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; color: #374151; font-size: 14px; line-height: 1.6; }
  .footer { padding: 24px 32px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  .qr-placeholder { width: 120px; height: 120px; margin: 16px auto; background: #f0fdf4; border: 2px dashed #bbf7d0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #16a34a; }
</style>
</head>
<body>
<div class="certificate">
  <div class="header">
    <h1>${this.escapeHtml(data.title)}</h1>
    <span class="type">${this.escapeHtml(data.certType.replace(/_/g, ' '))}</span>
  </div>
  <div class="body">
    <div class="field">
      <span class="label">Product</span>
      <span class="value">${this.escapeHtml(data.productName)}</span>
    </div>
    <div class="field">
      <span class="label">Issuer</span>
      <span class="value">${data.issuerName ? this.escapeHtml(data.issuerName) : '—'}</span>
    </div>
    <div class="field">
      <span class="label">Issued</span>
      <span class="value">${data.issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    ${data.expiresAt ? `<div class="field"><span class="label">Expires</span><span class="value">${data.expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>` : ''}
    <div class="field">
      <span class="label">Status</span>
      <span class="value"><span class="status-badge">${statusIcon} ${isActive ? 'Active' : 'Revoked'}</span></span>
    </div>
    ${data.description ? `<div class="description">${this.escapeHtml(data.description)}</div>` : ''}
    <div class="qr-placeholder">Verification QR</div>
  </div>
  <div class="footer">
    VerdeChain Certificate &bull; ${this.escapeHtml(data.id)}
    ${data.ipfsHash ? `<br>IPFS: ${this.escapeHtml(data.ipfsHash)}` : ''}
  </div>
</div>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
