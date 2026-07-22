import { env } from '../config/env';

export function fixMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const apiUrl = new URL(env.apiBaseUrl);
    urlObj.hostname = apiUrl.hostname;
    urlObj.port = apiUrl.port;
    urlObj.protocol = apiUrl.protocol;
    return urlObj.toString();
  } catch {
    return url;
  }
}
