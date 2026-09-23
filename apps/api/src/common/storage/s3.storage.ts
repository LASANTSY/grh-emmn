import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { StorageService, StoragePutInput, StoredFileInfo } from './storage.interface';

/**
 * Stockage objet compatible S3 (MinIO, AWS S3...). Même contrat métier que le
 * stockage local : le code métier ne dépend pas du driver (§7).
 */
@Injectable()
export class S3StorageService extends StorageService {
  readonly driver = 's3' as const;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3StorageService.name);

  constructor(private readonly config: ConfigService) {
    super();
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'grh-emmn';
    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      endpoint: this.config.get<string>('S3_ENDPOINT') || undefined,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY') ?? 'minioadmin',
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY') ?? 'minioadmin',
      },
    });
  }

  async put(input: StoragePutInput): Promise<StoredFileInfo> {
    const safeName = input.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const key = `${input.folder ?? 'fichiers'}/${randomUUID()}-${safeName}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );
    this.logger.log(`Fichier stocké S3 : ${key}`);
    return { key };
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string): string | null {
    return `/api/storage/s3/${encodeURIComponent(key)}`;
  }
}