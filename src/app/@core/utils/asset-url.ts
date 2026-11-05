import { environment } from '../../../environments/environment.development';

/**
 * Resolves API-relative asset paths (for example `/assets/temas/team.png`)
 * against the backend URL while leaving absolute or data URLs untouched.
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
