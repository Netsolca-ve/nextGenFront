import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheck,
  LucideClock,
  LucideMapPin,
  LucideShieldCheck,
  LucideUsers,
} from '@lucide/angular';
import { forkJoin } from 'rxjs';
import {
  AdminTournament,
  parseFormatoConfig,
  toDateInput,
  TournamentMatch,
  TournamentStanding,
} from '../../../../../@core/models/tournament.models';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { matchSlug } from '../../../../../@core/utils/match-slug';
import { Teams } from '../../../../../@core/services/teams';
import { AdminTeam } from '../../../../../@core/models/team.models';

@Component({
  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideArrowRight,
    LucideCalendarDays,
    LucideCheck,
    LucideClock,
    LucideMapPin,
    LucideShieldCheck,
    LucideUsers,
  ],
  selector: 'app-event',
  styleUrl: './event.scss',
  templateUrl: './event.html',
})
export class Event {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(Tournaments);
  private readonly teamsService = inject(Teams);

  readonly tournament = signal<AdminTournament | null>(null);
  readonly matches = signal<TournamentMatch[]>([]);
  readonly standings = signal<TournamentStanding[]>([]);
  readonly loading = signal(true);
  readonly eventId = signal('');

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.loadEvent(id);
    });
  }

  loadEvent(id: string): void {
    this.loading.set(true);
    forkJoin({
      tournaments: this.service.getAllTournaments(),
      matches: this.service.getTournamentMatches(id),
      standings: this.service.getTournamentStandings(id),
      teams: this.teamsService.getAllTeams(),
    }).subscribe({
      next: (result) => {
        const teams = Array.isArray(result.teams) ? result.teams : (result.teams.data ?? []);
        this.eventId.set(id);
        const tournament = result.tournaments.find((item) => String(item.idTorneo ?? item.id) === id);
        this.tournament.set(tournament ?? null);
        this.matches.set(result.matches);
        this.standings.set(result.standings.map((standing) => ({
          ...standing,
          logo: standing.logo ?? this.teamLogo(teams, standing.idEquipo),
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  tournamentName(): string { return this.tournament()?.nombre ?? this.tournament()?.name ?? 'Torneo NextGen'; }
  subtitle(): string { return this.tournament()?.description ?? 'Competencia deportiva NextGen.'; }
  organizer(): string { return this.tournament()?.organizador ?? this.tournament()?.organizer ?? 'NextGen'; }
  place(): string { return this.tournament()?.sede ?? this.tournament()?.place ?? 'Sede por definir'; }
  categories(): string[] {
    const tournament = this.tournament();
    return tournament?.categorias ?? tournament?.categories ?? (tournament?.categoria ? tournament.categoria.split(',').map((item) => item.trim()) : []);
  }
  dateRange(): string {
    const tournament = this.tournament();
    const start = this.formatDate(tournament?.fechaInicio ?? tournament?.fecha_inicio);
    const end = this.formatDate(tournament?.fechaFin ?? tournament?.fecha_fin);
    return start && end ? `${start} - ${end}` : start || end || 'Fecha por definir';
  }
  time(): string { return parseFormatoConfig(this.tournament()?.formato_config).horaInicioJornada ?? 'Por definir'; }
  matchDate(value: string): string { return this.formatDate(value); }
  teamName(match: TournamentMatch, side: 'local' | 'away'): string { return side === 'local' ? (match.nombreEquipoLocal ?? `Equipo ${match.idEquipoLocal ?? '-'}`) : (match.nombreEquipoVisitante ?? `Equipo ${match.idEquipoVisitante ?? '-'}`); }
  matchStatus(status: string | null): string { return status === 'FINISHED' ? 'Finalizado' : status === 'LIVE' ? 'En vivo' : 'Programado'; }
  matchSlug(match: TournamentMatch): string { return matchSlug(match.idPartido, match.nombreEquipoLocal, match.nombreEquipoVisitante); }
  private teamLogo(teams: AdminTeam[], idEquipo: number | null | undefined): string | null {
    const team = teams.find((item) => Number(item.idEquipo ?? item.id) === Number(idEquipo));
    return team?.logo ?? team?.image ?? null;
  }
  heroBackground(): string {
    const banner = this.tournament()?.banner;
    return banner ? `url("${banner}")` : '';
  }

  get shareUrl(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nextgen.ven';
    return encodeURIComponent(`${origin}/events/${this.eventId()}`);
  }

  private formatDate(value: unknown): string {
    const iso = toDateInput(value);
    return iso ? iso.split('-').reverse().join('/') : '';
  }
}
