import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.interface';
import { LocalStorageService } from './local.storage';
import { S3StorageService } from './s3.storage';

const storageProvider = {
  provide: StorageService,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const driver = config.get<string>('STORAGE_DRIVER');
    return driver === 's3'
      ? new S3StorageService(config)
      : new LocalStorageService(config);
  },
};

@Global()
@Module({
  providers: [storageProvider],
  exports: [StorageService],
})
export class StorageModule {}