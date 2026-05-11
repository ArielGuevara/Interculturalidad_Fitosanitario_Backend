import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

export const MINIO_CLIENT = 'MINIO_CLIENT';

export const minioClientProvider = {
  provide: MINIO_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const minio = configService.get<{
      endpoint: string;
      port: number;
      accessKey: string;
      secretKey: string;
      useSSL: boolean;
    }>('minio');

    return new Client({
      endPoint: minio?.endpoint ?? 'localhost',
      port: minio?.port ?? 9000,
      useSSL: minio?.useSSL ?? false,
      accessKey: minio?.accessKey ?? '',
      secretKey: minio?.secretKey ?? '',
    });
  },
};

export function buildMinioPublicUrl(params: {
  endpoint: string;
  port: number;
  bucket: string;
  objectKey: string;
  useSSL: boolean;
}) {
  const protocol = params.useSSL ? 'https' : 'http';
  const encodedKey = params.objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${protocol}://${params.endpoint}:${params.port}/${params.bucket}/${encodedKey}`;
}
