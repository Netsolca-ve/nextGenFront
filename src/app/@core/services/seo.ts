import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITE } from '../config/site';

interface PageSeo {
  title: string;
  description: string;
  noindex: boolean;
  path: string;
}

/**
 * Actualiza título, descripción, canonical y etiquetas Open Graph/Twitter en
 * cada navegación. También permite que una página dinámica (evento, partido)
 * sobrescriba el título cuando terminan de cargar sus datos.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private current: PageSeo | null = null;
  private started = false;

  init(): void {
    if (this.started) return;
    this.started = true;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.apply());
    this.apply();
  }

  /** Permite a una página dinámica fijar su propio título/descripción. */
  setPage(title: string, description?: string): void {
    if (!this.current) return;
    this.current.title = title;
    if (description) this.current.description = description;
    this.render();
  }

  private apply(): void {
    const data = this.mergedRouteData();
    const path = (this.router.url.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';

    this.current = {
      title: typeof data['title'] === 'string' ? data['title'] : this.routeTitle() ?? SITE.title,
      description:
        typeof data['description'] === 'string' ? data['description'] : SITE.description,
      noindex: data['noindex'] === true,
      path,
    };
    this.render();
  }

  private render(): void {
    if (!this.current) return;

    const { title, description, noindex, path } = this.current;
    const canonical = `${SITE.url}${path === '/' ? '/' : path}`;
    const image = `${SITE.url}${SITE.image}`;

    this.title.setTitle(title);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow',
    });

    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE.name });
    this.meta.updateTag({ property: 'og:locale', content: SITE.locale });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(canonical);
  }

  /** `title` de la ruta activa más profunda (las rutas lo definen con `title:`, no en `data`). */
  private routeTitle(): string | undefined {
    let route = this.router.routerState.snapshot.root;
    let title = route.title;

    while (route.firstChild) {
      route = route.firstChild;
      title = route.title ?? title;
    }

    return title;
  }

  /** Junta los `data` de todas las rutas activas (padre → hijo). */
  private mergedRouteData(): Record<string, unknown> {
    let route = this.router.routerState.snapshot.root;
    let data: Record<string, unknown> = {};

    while (route) {
      data = { ...data, ...route.data };
      if (!route.firstChild) break;
      route = route.firstChild;
    }

    return data;
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }
}
