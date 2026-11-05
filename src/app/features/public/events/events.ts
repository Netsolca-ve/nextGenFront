import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCalendarDays,
  LucideGoal,
  LucideTrophy,
} from '@lucide/angular';
import { AdminTournament, parseFormatoConfig, toDateInput } from '../../../@core/models/tournament.models';
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
    return {
      id: String(tournament.idTorneo ?? tournament.id ?? ''),
      mark: (tournament.nombre ?? tournament.name ?? 'NG').slice(0, 3).toUpperCase(),
      image: tournament.banner ?? tournament.image ?? '',
      brand: tournament.organizador ?? tournament.organizer ?? 'NextGen',
      name: tournament.nombre ?? tournament.name ?? 'Torneo NextGen',
      subtitle: tournament.description ?? 'Competencia deportiva NextGen.',
      status: tournament.estado ?? tournament.status ?? 'Programado',
      statusClass: this.statusClass(tournament.estado ?? tournament.status),
      dateShort: this.dateRange(start, end),
      dateLong: this.dateRange(start, end),
      place: tournament.sede ?? tournament.place ?? 'Sede por definir',
      organizer: tournament.organizador ?? tournament.organizer ?? 'NextGen',
      categoryLabel: categories.join(' · '),
      categories: categories.map((name) => ({ name, years: '' })),
      expectations: [],
      time: config.horaInicioJornada ?? 'Por definir',
    };
  }

  private statusClass(status?: string): PublicTournament['statusClass'] {
    const value = (status ?? '').toLowerCase();
    return value.includes('final') ? 'finished' : value.includes('abierta') || value.includes('open') ? 'open' : 'upcoming';
  }

  private dateRange(start: string, end: string): string {
    const format = (value: string) => value ? value.split('-').reverse().join('/') : '';
    return start && end ? `${format(start)} - ${format(end)}` : format(start || end) || 'Fecha por definir';
  }
}
