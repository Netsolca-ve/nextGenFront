import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideVenezuelaDates } from './@core/utils/ve-date-adapter';

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
    provideHttpClient(),
    // Fechas dd/mm/aaaa y horas 12 h en toda la app, sin depender del idioma
    // del navegador de cada cliente
    provideVenezuelaDates(),
  ]
};
