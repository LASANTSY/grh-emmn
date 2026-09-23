export interface StoredFileInfo {
  key: string;
}

export interface StoragePutInput {
  buffer: Buffer;
  originalname: string;
  mimeType: string;
  /** Préfixe / dossier (ex. `pieces/abc123`) */
  folder?: string;
}

/**
 * Abstraction de stockage : le métier ne dépend pas du système de fichiers
 * local (§7). Implémentation `local` en développement, `s3` (MinIO/S3) en prod.
 */
export abstract class StorageService {
  abstract readonly driver: 'local' | 's3';
  abstract put(input: StoragePutInput): Promise<StoredFileInfo>;
  abstract get(key: string): Promise<Buffer>;
  abstract remove(key: string): Promise<void>;
  abstract getPublicUrl(key: string): string | null;
}