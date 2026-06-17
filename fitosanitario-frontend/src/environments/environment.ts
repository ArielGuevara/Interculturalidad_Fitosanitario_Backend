export const environment = {
    production: false,
    apiUrl: (import.meta as any).env.NG_APP_API_URL || 'http://localhost:3000/api',
    minioPublicUrl: (import.meta as any).env.NG_APP_MINIO_PUBLIC_URL || 'http://localhost:9000'
};
