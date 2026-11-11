import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Páginas públicas que se generan como HTML completo en el build (mejor SEO:
 * Google recibe el título y el texto sin ejecutar JavaScript). El resto
 * (admin, torneos y partidos con datos en vivo) se renderiza en el navegador.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about-us', renderMode: RenderMode.Prerender },
  { path: 'academies', renderMode: RenderMode.Prerender },
  { path: 'academies/almirantes', renderMode: RenderMode.Prerender },
  { path: 'events', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
