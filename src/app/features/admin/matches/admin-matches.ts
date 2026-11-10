import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucidePencil, LucideSwords, LucideTrash2 } from '@lucide/angular';
import { AdminMatch } from '../../../@core/models/match.models';
import { AdminTournament } from '../../../@core/models/tournament.models';
import { Matches } from '../../../@core/services/matches';
import { Tournaments } from '../../../@core/services/tournaments';
import { Notifications } from '../../../@core/services/notifications';
import { getErrorMessage } from '../../../@core/utils/http-error';
import { formatDisplayTime } from '../../../@core/utils/datetime';
import { DeleteMatch, DeleteMatchData } from './components/delete-match/delete-match';
import { EditMatch } from './components/edit-match/edit-match';

@Component({
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    LucidePencil,
    LucideSwords,
    LucideTrash2,
  ],
  selector: 'app-admin-matches',
  styleUrl: './admin-matches.scss',
  templateUrl: './admin-matches.html',
})
export class AdminMatches {
  private readonly matchesService = inject(Matches);
  private readonly tournamentsService = inject(Tournaments);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(Notifications);

  readonly matches = signal<AdminMatch[]>([]);
  readonly loading = signal(true);
  readonly tournamentOptions = signal<AdminTournament[]>([]);
  readonly search = signal('');
  readonly tournamentFilter = signal('');
  readonly categoryFilter = signal('');
  /** Día del filtro: Date al elegirlo en el datepicker, null si está vacío. */
  readonly dateFilter = signal<Date | null>(null);

  readonly filteredMatches = computed(() => {
    const query = this.search().trim().toLowerCase();
    const tournament = this.tournamentFilter();
    const category = this.categoryFilter().trim().toLowerCase();
    const date = this.toIsoDate(this.dateFilter());

    return this.matches().filter((match) => {
      const teams = `${this.teamName(match, 'local')} ${this.teamName(match, 'away')}`.toLowerCase();
      const matchTournament = String(match.idTorneo);
      const matchCategories = this.category(match).split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
      return (!query || teams.includes(query)) && (!tournament || matchTournament === tournament) && (!category || matchCategories.includes(category)) && (!date || this.toIsoDate(match.fecha) === date);
    });
  });

  /** Categorías reales presentes en los partidos (p. ej. "SUB 9", "SUB 12"). */
  readonly categories = computed(() => {
    const values = new Set<string>();
    for (const match of this.matches()) {
      for (const part of this.category(match).split(',')) {
        const value = part.trim();
        if (value) values.add(value);
      }
    }
    return [...values].sort();
  });

  constructor() {
    this.loadMatches();
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.tournamentsService.getAllTournaments().subscribe({
      next: (response) => {
        const payload = response as AdminTournament[] | { data?: AdminTournament[] };
        this.tournamentOptions.set(Array.isArray(payload) ? payload : (payload.data ?? []));
      },
      error: (requestError: unknown) => {
        this.tournamentOptions.set([]);
        this.notifications.error(getErrorMessage(requestError, 'No se pudieron cargar los torneos.'));
      },
    });
  }

  loadMatches(): void {
    this.loading.set(true);
    this.matchesService.getAllMatches().subscribe({
      next: (matches) => {
        this.matches.set(matches);
        console.log('Loaded matches:', matches);
        this.loading.set(false);
      },
      error: (requestError: unknown) => {
        this.matches.set([]);
        this.loading.set(false);
        this.notifications.error(getErrorMessage(requestError, 'No se pudieron cargar los partidos.'));
      },
    });
  }

  openEditDialog(match: AdminMatch): void {
    this.dialog
      .open(EditMatch, {
        data: match,
        width: 'min(1180px, calc(100vw - 32px))',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '94vh',
      })
      .afterClosed()
      .subscribe((saved) => saved && this.loadMatches());
  }

  openDeleteDialog(match: AdminMatch): void {
    const local = this.teamName(match, 'local');
    const away = this.teamName(match, 'away');
    const time = this.matchTime(match);
    const data: DeleteMatchData = {
      idPartido: match.idPartido,
      title: `${local} ${match.marcadorLocal ?? 0} - ${match.marcadorVisitante ?? 0} ${away}`,
      subtitle: [
        `${this.matchDate(match)}${time ? ` · ${time}` : ''}`,
        this.tournament(match),
        this.faseLabel(match.fase),
      ]
        .filter(Boolean)
        .join(' · '),
    };

    this.dialog
      .open(DeleteMatch, {
        data,
        width: 'min(460px, calc(100vw - 32px))',
        maxWidth: 'calc(100vw - 32px)',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe((deleted) => {
        if (!deleted) return;
        // Se quita de la lista al instante y se recarga por si la fase
        // definitoria se reacomodó en el backend.
        this.matches.update((items) => items.filter((item) => item.idPartido !== match.idPartido));
        this.loadMatches();
      });
  }

  teamName(match: AdminMatch, side: 'local' | 'away'): string {
    if (side === 'local') return match.nombreEquipoLocal ?? match.equipoLocal?.nombre ?? `Equipo ${match.idEquipoLocal ?? '-'}`;
    return match.nombreEquipoVisitante ?? match.equipoVisitante?.nombre ?? `Equipo ${match.idEquipoVisitante ?? '-'}`;
  }

  category(match: AdminMatch): string {
    return match.categoria ?? match.torneo?.categoria ?? '';
  }

  tournament(match: AdminMatch): string {
    return match.nombreTorneo ?? match.torneo?.nombre ?? this.tournamentOptions().find((item) => String(item.id ?? item.idTorneo) === String(match.idTorneo))?.nombre ?? '';
  }

  matchDate(match: AdminMatch): string {
    const value = this.toIsoDate(match.fecha);
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : 'Sin fecha';
  }

  /** Hora programada del partido ('' si no tiene). */
  matchTime(match: AdminMatch): string {
    return formatDisplayTime(match.fecha);
  }

  private toIsoDate(value: unknown): string {
    if (!value) return '';

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return this.isoParts(value.getFullYear(), value.getMonth() + 1, value.getDate());
    }

    const raw = String(value).trim();
    const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (dmy) return this.isoParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));

    const ymd = raw.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    return ymd ? this.isoParts(Number(ymd[1]), Number(ymd[2]), Number(ymd[3])) : '';
  }

  private isoParts(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  statusLabel(status: string | null): string {
    const labels: Record<string, string> = {
      programado: 'Programado',
      en_vivo: 'En vivo',
      finalizado: 'Finalizado',
      // Estados legacy del backend
      SCHEDULED: 'Programado',
      PENDING: 'Por definir',
      LIVE: 'En vivo',
      FINALIZED: 'Finalizado',
    };
    return labels[status ?? ''] ?? status ?? 'Sin estado';
  }

  faseLabel(fase: string | null): string {
    const labels: Record<string, string> = {
      GRUPO: 'Fase de grupos',
      SEMI_FINAL: 'Semifinal',
      TERCER_LUGAR: 'Tercer lugar',
      FINAL: 'Gran Final',
    };
    return labels[fase ?? ''] ?? fase ?? 'Fase sin definir';
  }
}
