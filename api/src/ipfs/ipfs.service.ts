import { Injectable, Logger, NotFoundException } from '@nestjs/common';

export interface IpfsConfig {
  pinataApiKey: string;
  pinataApiSecret: string;
  pinataJwt: string;
  gatewayUrl: string;
}

export interface IpfsUploadResult {
  cid: string;
  size: number;
  url: string;
}

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);

  constructor(private readonly config: IpfsConfig) {}

  async upload(buffer: Buffer, filename: string): Promise<IpfsUploadResult> {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    formData.append('file', blob, filename);

    const response = await this.fetchWithFallback(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.pinataJwt}`,
        },
        body: formData,
      },
    );

    const data = (await response.json()) as { IpfsHash?: string };
    const cid = data.IpfsHash ?? '';

    return {
      cid,
      size: buffer.length,
      url: `${this.config.gatewayUrl}/${cid}`,
    };
  }

  async pinJSON(data: Record<string, unknown>): Promise<IpfsUploadResult> {
    const response = await this.fetchWithFallback(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.pinataJwt}`,
        },
        body: JSON.stringify(data),
      },
    );

    const result = (await response.json()) as { IpfsHash?: string };
    const cid = result.IpfsHash ?? '';

    return {
      cid,
      size: JSON.stringify(data).length,
      url: `${this.config.gatewayUrl}/${cid}`,
    };
  }

  async get(cid: string): Promise<Buffer> {
    try {
      const response = await this.fetchWithFallback(`${this.config.gatewayUrl}/${cid}`, {
        method: 'GET',
      });

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error(
        `Failed to fetch CID ${cid}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Content not found for CID: ${cid}`);
    }
  }

  async delete(cid: string): Promise<boolean> {
    try {
      const response = await this.fetchWithFallback(
        `https://api.pinata.cloud/pinning/unpin/${cid}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.config.pinataJwt}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Pinata responded with ${response.status}`);
      }

      this.logger.log(`Unpinned CID: ${cid}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to unpin CID ${cid}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async fetchWithFallback(url: string, options: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      if (this.config.pinataApiKey && this.config.pinataApiSecret && !this.config.pinataJwt) {
        const headers: Record<string, string> = {
          pinata_api_key: this.config.pinataApiKey,
          pinata_secret_api_key: this.config.pinataApiSecret,
          ...(options.headers as Record<string, string>),
        };

        const fallbackResponse = await fetch(url, { ...options, headers });
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
        }
        return fallbackResponse;
      }
      throw error;
    }
  }
}
