import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideMenu, LucideX } from '@lucide/angular';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LucideMenu, LucideX],
  selector: 'app-public-layout',
  styleUrl: './public-layout.scss',
  templateUrl: './public-layout.html',
})
export class PublicLayout {
  readonly menuOpen = signal(false);

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
