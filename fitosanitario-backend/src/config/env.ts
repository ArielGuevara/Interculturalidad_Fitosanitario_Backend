export const envConfig = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || `http://${process.env.MINIO_PUBLIC_ENDPOINT || 'localhost'}:${parseInt(process.env.PORT || '3000', 10)}`,
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
    publicEndpoint:
      process.env.MINIO_PUBLIC_ENDPOINT ||
      process.env.MINIO_ENDPOINT ||
      'localhost',
    publicPort: parseInt(
      process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || '9000',
      10,
    ),
    publicUseSSL:
      (
        process.env.MINIO_PUBLIC_USE_SSL ||
        process.env.MINIO_USE_SSL ||
        'false'
      ).toLowerCase() === 'true',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
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
