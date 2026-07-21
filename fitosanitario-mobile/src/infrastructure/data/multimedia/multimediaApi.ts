import { apiClient } from '../../http/apiClient';

export const multimediaApi = {
  uploadImage: async (uri: string): Promise<string> => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    formData.append('files', { uri, type: mime, name: filename } as any);
    const { data } = await apiClient.post<{ count: number; urls: string[] }>(
      '/multimedia/upload-image',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.urls[0];
  },
};
