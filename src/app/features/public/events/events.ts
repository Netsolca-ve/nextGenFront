import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { scrollToSection } from '../../../@core/utils/scroll-to-section';
import {
  LucideArrowRight,
  LucideCalendarDays,
  LucideGoal,
  LucideTrophy,
} from '@lucide/angular';
import {
  AdminTournament,
  DEFAULT_EVENT_BANNER,
  isProximamente,
  normalizeEstado,
  parseFormatoConfig,
  PROXIMAMENTE_BANNER,
  toDateInput,
  TORNEO_ESTATOS,
} from '../../../@core/models/tournament.models';
import { Tournaments } from '../../../@core/services/tournaments';

interface PublicTournament {
  id: string;
  mark: string;
  image: string;
  brand: string;
  name: string;
  subtitle: string;
  status: string;
  statusClass: 'upcoming' | 'open' | 'finished';
  /** Torneo aún no anunciado: solo se muestra la imagen y el título "Próximamente". */
  comingSoon: boolean;
  dateShort: string;
  dateLong: string;
  place: string;
  organizer: string;
  categoryLabel: string;
  categories: { name: string; years: string }[];
  expectations: string[];
  time: string;
}

@Component({
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideCalendarDays,
    LucideGoal,
    LucideTrophy,
  ],
  selector: 'app-events',
  styleUrl: './events.scss',
  templateUrl: './events.html',
})
export class Events {
  private readonly service = inject(Tournaments);

  goToTournaments(event: Event): void {
    event.preventDefault();
    history.replaceState(history.state, '', '/events#torneos');
    scrollToSection('torneos');
  }
  readonly tournaments = signal<PublicTournament[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.service.getAllTournaments().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments.map((tournament) => this.toPublicTournament(tournament)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private toPublicTournament(tournament: AdminTournament): PublicTournament {
    const config = parseFormatoConfig(tournament.formato_config);
    const start = toDateInput(tournament.fechaInicio ?? tournament.fecha_inicio);
    const end = toDateInput(tournament.fechaFin ?? tournament.fecha_fin);
    const categories = tournament.categorias ?? tournament.categories ?? (tournament.categoria ? tournament.categoria.split(',').map((item) => item.trim()) : []);
    const estado = tournament.estado ?? tournament.status ?? 'PROGRAMADO';
    const comingSoon = isProximamente(estado);
    return {
      id: String(tournament.idTorneo ?? tournament.id ?? ''),
      mark: (tournament.nombre ?? tournament.name ?? 'NG').slice(0, 3).toUpperCase(),
      // Los torneos por anunciarse siempre muestran su imagen de "Próximamente"
      image: comingSoon ? PROXIMAMENTE_BANNER : tournament.banner ?? tournament.image ?? DEFAULT_EVENT_BANNER,
      brand: tournament.organizador ?? tournament.organizer ?? 'Next Gen',
      name: tournament.nombre ?? tournament.name ?? 'Torneo Next Gen',
      subtitle: tournament.description ?? 'Competencia deportiva Next Gen.',
      status: comingSoon ? 'Próximamente' : this.statusLabel(estado),
      statusClass: this.statusClass(estado),
      comingSoon,
      dateShort: this.dateRange(start, end),
      dateLong: this.dateRange(start, end),
      place: tournament.sede ?? tournament.place ?? 'Sede por definir',
      organizer: tournament.organizador ?? tournament.organizer ?? 'Next Gen',
      categoryLabel: categories.join(' · '),
      categories: categories.map((name) => ({ name, years: '' })),
      expectations: [],
      time: config.horaInicioJornada ?? 'Por definir',
    };
  }

  /** Traduce el estado guardado (PROGRAMADO, EN_CURSO...) a su etiqueta legible. */
  private statusLabel(estado: string): string {
    const value = normalizeEstado(estado);
    const found = TORNEO_ESTATOS.find(
      (option) => normalizeEstado(option.value) === value || normalizeEstado(option.label) === value,
    );
    return found?.label ?? estado;
  }

  private statusClass(status?: string): PublicTournament['statusClass'] {
    const value = normalizeEstado(status);
    return value.includes('final') ? 'finished' : value.includes('abierta') || value.includes('open') ? 'open' : 'upcoming';
  }

  private dateRange(start: string, end: string): string {
    const format = (value: string) => value ? value.split('-').reverse().join('/') : '';
    return start && end ? `${format(start)} - ${format(end)}` : format(start || end) || 'Fecha por definir';
  }
}
