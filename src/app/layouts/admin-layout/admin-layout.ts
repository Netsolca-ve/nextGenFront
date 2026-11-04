import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideArrowRight,
  LucideBell,
  LucideChevronDown,
  LucideCircleHelp,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucidePanelLeft,
  LucideSearch,
  LucideSwords,
  LucideTrophy,
  LucideUsers,
  LucideX,
} from '@lucide/angular';

interface AdminNavItem {
  label: string;
  description: string;
  route: string;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Partido',
    description: 'Programa un nuevo encuentro',
    route: '/admin/partidos',
  },
  {
    label: 'Torneos',
    description: 'Configura un nuevo torneo',
    route: '/admin/torneos',
  },
  {
    label: 'Equipos',
    description: 'Gestiona los equipos registrados',
    route: '/admin/equipos',
  },
];

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideArrowRight,
    // LucideBell,
    // LucideChevronDown,
    // LucideCircleHelp,
    LucideLayoutDashboard,
    LucideLogOut,
    LucideMenu,
    LucidePanelLeft,
    LucideSearch,
    LucideSwords,
    LucideTrophy,
    LucideUsers,
    LucideX,
  ],
  selector: 'app-admin-layout',
  styleUrl: './admin-layout.scss',
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly searchQuery = signal('');

  readonly searchResults = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return [];
    }

    return ADMIN_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query),
    );
  });

  toggleCollapsed(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  toggleMobile(): void {
    this.mobileOpen.update((open) => !open);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onNavigate(): void {
    this.clearSearch();
    this.closeMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth > 1024) {
      this.closeMobile();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.clearSearch();
    this.closeMobile();
  }
}
