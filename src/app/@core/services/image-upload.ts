import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 600;

@Service()
export class ImageUpload {
  private readonly http = inject(HttpClient);
  private readonly api = environment.api;

  upload(file: File, folder: 'teams' | 'players' | 'tournaments'): Observable<string> {
    return from(this.prepare(file)).pipe(
      switchMap((image) =>
        this.http.post<{ url: string }>(`${this.api}/uploads/image`, { image, folder }),
      ),
      map((response) => response.url),
    );
  }

  private async prepare(file: File): Promise<string> {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      throw new Error('Selecciona una imagen PNG, JPG o WebP.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('La imagen no puede superar los 5 MB.');
    }

    const dataUrl = await this.readAsDataUrl(file);
    const image = await this.loadImage(dataUrl);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));

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

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';
    return canvas.toDataURL(outputType, 0.9);
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
