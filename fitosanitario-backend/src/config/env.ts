export const envConfig = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'root',
    secretKey: process.env.MINIO_SECRET_KEY || 'root12345',
    bucket: process.env.MINIO_BUCKET || 'fitosanitario',
    useSSL: (process.env.MINIO_USE_SSL || 'false').toLowerCase() === 'true',
  },
  uploads: {
    // Límites por archivo (en bytes). Si no se setean, se usan defaults seguros en código.
    maxImageSizeBytes: process.env.MAX_IMAGE_SIZE_BYTES
      ? parseInt(process.env.MAX_IMAGE_SIZE_BYTES, 10)
      : undefined,
    maxAudioSizeBytes: process.env.MAX_AUDIO_SIZE_BYTES
      ? parseInt(process.env.MAX_AUDIO_SIZE_BYTES, 10)
      : undefined,
  },
});