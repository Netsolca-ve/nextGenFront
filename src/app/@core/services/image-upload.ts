import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export type ImageFolder = 'teams' | 'players' | 'tournaments';

const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Lado mayor con el que se envía cada tipo de imagen. El backend la vuelve a
 * redimensionar y convertir a WebP; aquí solo se evita mandar archivos enormes.
 */
const MAX_DIMENSION: Record<ImageFolder, number> = {
  teams: 512,
  players: 800,
  tournaments: 1600,
};

@Service()
export class ImageUpload {
  private readonly http = inject(HttpClient);
  private readonly api = environment.api;

  /**
   * Sube la imagen a R2 (carpeta temporal) y devuelve su URL pública para la
   * vista previa. Al guardar el equipo, jugador o torneo con esa URL, el
   * backend la mueve a su nombre definitivo (ej. `equipos/{slug}.webp`).
   */
  upload(file: File, folder: ImageFolder): Observable<string> {
    return from(this.prepare(file, MAX_DIMENSION[folder])).pipe(
      switchMap((image) =>
        this.http.post<{ key: string; url: string }>(`${this.api}/uploads/image`, {
          image,
          folder,
        }),
      ),
      map((response) => response.url),
    );
  }

  private async prepare(file: File, maxDimension: number): Promise<string> {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      throw new Error('Selecciona una imagen PNG, JPG o WebP.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('La imagen no puede superar los 5 MB.');
    }

    const dataUrl = await this.readAsDataUrl(file);
    const image = await this.loadImage(dataUrl);
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));

    if (scale === 1 && file.size <= 300_000) {
      return dataUrl;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');

    if (!context) {
      return dataUrl;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    // WebP conserva la transparencia de los PNG y pesa menos
    return canvas.toDataURL('image/webp', 0.9);
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      image.src = source;
    });
  }
}
