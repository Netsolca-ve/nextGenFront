import { environment } from '../../../environments/environment.development';

/**
 * Resolves API-relative asset paths against the backend URL while leaving
 * absolute or data URLs untouched. Images now come from the API as absolute
 * Cloudflare R2 URLs; this only covers older relative paths.
 */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${environment.api}${path}`;
  }

  return path;
}
