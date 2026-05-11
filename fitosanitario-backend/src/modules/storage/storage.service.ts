import {
  Injectable,
  Inject,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'crypto';
import * as path from 'path';
import {
  buildMinioPublicUrl,
  MINIO_CLIENT,
} from '../../infrastructure/storage/minio.provider';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  private readonly endpoint: string;
  private readonly port: number;
  private readonly bucket: string;
  private readonly useSSL: boolean;

  constructor(
    @Inject(MINIO_CLIENT) private readonly minio: Client,
    private readonly configService: ConfigService,
  ) {
    const minioConfig = this.configService.get<{
      endpoint: string;
      port: number;
      bucket: string;
      useSSL: boolean;
    }>('minio');

    this.endpoint = minioConfig?.endpoint ?? 'localhost';
    this.port = minioConfig?.port ?? 9000;
    this.bucket = minioConfig?.bucket ?? 'fitosanitario';
    this.useSSL = minioConfig?.useSSL ?? false;
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.minio.bucketExists(this.bucket);

      if (!exists) {
        await this.minio.makeBucket(this.bucket);
        this.logger.log(`Bucket creado: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.error('Error creando/verificando bucket', error as Error);

      throw new InternalServerErrorException(
        'Error inicializando storage (MinIO)',
      );
    }
  }

  generateObjectKey(params: {
    folder: 'images' | 'audio';
    originalName?: string;
    contentType: string;
  }) {
    const extFromName = params.originalName
      ? path.extname(params.originalName).toLowerCase()
      : '';

    const fallbackExt = params.contentType.startsWith('image/')
      ? '.jpg'
      : params.contentType.startsWith('audio/')
        ? '.m4a'
        : '';

    const ext = extFromName || fallbackExt;

    return `${params.folder}/${randomUUID()}${ext}`;
  }

  async uploadBuffer(params: {
    buffer: Buffer;
    objectKey: string;
    contentType: string;
  }) {
    try {
      // 🔥 VALIDACIÓN CRÍTICA
      if (!params.buffer || params.buffer.length === 0) {
        throw new InternalServerErrorException('Archivo vacío (buffer)');
      }

      await this.minio.putObject(
        this.bucket,
        params.objectKey,
        params.buffer,
        params.buffer.length,
        {
          'Content-Type': params.contentType,
        } as any, 
      );

      const url = buildMinioPublicUrl({
        endpoint: this.endpoint,
        port: this.port,
        bucket: this.bucket,
        objectKey: params.objectKey,
        useSSL: this.useSSL,
      });

      return {
        bucket: this.bucket,
        objectKey: params.objectKey,
        url,
      };
    } catch (error) {
      this.logger.error('Error subiendo archivo a MinIO', error as Error);

      console.log('MINIO DEBUG:', {
        bucket: this.bucket,
        objectKey: params.objectKey,
        contentType: params.contentType,
        error,
      });

      throw new InternalServerErrorException(
        'Error subiendo archivo a almacenamiento (MinIO)',
      );
    }
  }
}