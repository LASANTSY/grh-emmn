import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { StorageService, StoragePutInput, StoredFileInfo } from './storage.interface';

/**
 * Stockage local (développement / petite instance). Les fichiers sont stockés
 * sous `UPLOAD_DIR`, sans logique métier.
 */
@Injectable()
export class LocalStorageService extends StorageService {
  readonly driver = 'local' as const;
  private readonly baseDir: string;
  private readonly logger = new Logger(LocalStorageService.name);

  constructor(private readonly config: ConfigService) {
    super();
    this.baseDir = this.config.get<string>('UPLOAD_DIR') ?? './data/uploads';
  }

  async put(input: StoragePutInput): Promise<StoredFileInfo> {
    const safeName = input.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const key = join(input.folder ?? 'fichiers', `${randomUUID()}-${safeName}`);
    const absolute = join(this.baseDir, key);
    await mkdir(join(this.baseDir, input.folder ?? 'fichiers'), { recursive: true });
    await writeFile(absolute, input.buffer);
    this.logger.log(`Fichier écrit : ${key} (${input.buffer.length} octets)`);
    return { key };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(join(this.baseDir, key));
  }

  async remove(key: string): Promise<void> {
    await rm(join(this.baseDir, key), { force: true });
  }

  getPublicUrl(key: string): string | null {
    return `/api/storage/local/${encodeURIComponent(key)}`;
  }
}