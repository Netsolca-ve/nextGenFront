import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { scrollToSection } from '../../@core/utils/scroll-to-section';
import { LucideMenu, LucideX } from '@lucide/angular';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LucideMenu, LucideX],
  selector: 'app-public-layout',
  styleUrl: './public-layout.scss',
  templateUrl: './public-layout.html',
})
export class PublicLayout {
  private readonly router = inject(Router);
  readonly menuOpen = signal(false);

  /**
   * Si ya estamos en inicio, Angular no navega al mismo enlace: hacemos el
   * scroll aquí. Si venimos de otra página, el routerLink navega y la página
   * de inicio se encarga de bajar a la sección.
   */
  goToSection(id: string, event: Event): void {
    this.closeMenu();
    const path = this.router.url.split(/[?#]/)[0];
    if (path === '/' || path === '') {
      event.preventDefault();
      history.replaceState(history.state, '', `/#${id}`);
      scrollToSection(id);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth > 900) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }
}
