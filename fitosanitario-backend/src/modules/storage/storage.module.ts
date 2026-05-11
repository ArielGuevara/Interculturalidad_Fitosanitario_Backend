import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { minioClientProvider } from '../../infrastructure/storage/minio.provider';

@Module({
  providers: [minioClientProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
