import { isPlatformServer } from '@angular/common';
import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { EMPTY } from 'rxjs';
import { provideVenezuelaDates } from './@core/utils/ve-date-adapter';

/**
 * En el prerender (build) no se llama a la API: torneos, partidos y tablas se
 * cargan en el navegador para que nunca queden datos viejos en el HTML.
 */
const browserOnlyApi: HttpInterceptorFn = (request, next) =>
  isPlatformServer(inject(PLATFORM_ID)) ? EMPTY : next(request);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // El salto a secciones (#ecosystem, #academies) lo hace scrollToSection
      // para que respete scroll-margin-top; Angular aquí solo vuelve arriba.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
      }),
      withViewTransitions()
    ),
    provideHttpClient(withInterceptors([browserOnlyApi])),
    // Reutiliza el HTML prerenderizado en vez de volver a pintarlo
    provideClientHydration(withEventReplay()),
    // Fechas dd/mm/aaaa y horas 12 h en toda la app, sin depender del idioma
    // del navegador de cada cliente
    provideVenezuelaDates(),
  ]
};
