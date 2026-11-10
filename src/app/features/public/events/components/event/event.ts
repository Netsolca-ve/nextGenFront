import { Component, computed, inject, signal } from '@angular/core';
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
  DEFAULT_EVENT_BANNER,
  getTournamentCategories,
  isProximamente,
  parseFormatoConfig,
  PROXIMAMENTE_BANNER,
  sameCategory,
  toDateInput,
  TournamentMatch,
  TournamentStanding,
  uniqueCategories,
} from '../../../../../@core/models/tournament.models';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { SeoService } from '../../../../../@core/services/seo';
import { matchSlug } from '../../../../../@core/utils/match-slug';
import { formatDisplayTime } from '../../../../../@core/utils/datetime';
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
  private readonly seo = inject(SeoService);

  readonly tournament = signal<AdminTournament | null>(null);
  readonly matches = signal<TournamentMatch[]>([]);
  readonly standings = signal<TournamentStanding[]>([]);
  readonly categories = signal<string[]>([]);
  readonly selectedCategory = signal('');
  readonly filteredMatches = computed(() => this.filterMatchesByCategory(this.matches()));
  readonly filteredStandings = computed(() => this.filterStandingsByCategory(this.standings()));
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
        const teamCategories = new Map<number, string>();
        for (const team of teams) {
          const teamId = Number(team.idEquipo ?? team.id);
          const category = team.categoria ?? team.category;
          if (Number.isFinite(teamId) && category) {
            teamCategories.set(teamId, category);
          }
        }

        this.eventId.set(id);
        const tournament = result.tournaments.find((item) => String(item.idTorneo ?? item.id) === id);
        this.tournament.set(tournament ?? null);

        this.seo.setPage(
          `${this.tournamentName()} | Next Gen Sport Ecosystem`,
          this.subtitle(),
        );

        const matches = result.matches.map((match) => ({
          ...match,
          categoria:
            match.categoria ??
            match.categoriaEquipoLocal ??
            match.categoriaEquipoVisitante ??
            teamCategories.get(Number(match.idEquipoLocal)) ??
            teamCategories.get(Number(match.idEquipoVisitante)) ??
            null,
        }));
        this.matches.set(matches);

        const standings = result.standings.map((standing) => ({
          ...standing,
          logo: standing.logo ?? this.teamLogo(teams, standing.idEquipo),
          categoria: standing.categoria ?? teamCategories.get(Number(standing.idEquipo)) ?? null,
        }));
        this.standings.set(standings);

        const categories = uniqueCategories([
          getTournamentCategories(tournament),
          standings.map((standing) => standing.categoria),
          matches.flatMap((match) => [
            match.categoria,
            match.categoriaEquipoLocal,
            match.categoriaEquipoVisitante,
          ]),
        ]);
        this.categories.set(categories);
        const withData =
          categories.find((category) =>
            matches.some((match) => sameCategory(this.matchCategory(match), category)),
          ) ??
          categories.find((category) =>
            standings.some((standing) => sameCategory(standing.categoria, category)),
          );
        this.selectedCategory.set(withData ?? categories[0] ?? '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  tournamentName(): string { return this.tournament()?.nombre ?? this.tournament()?.name ?? 'Torneo Next Gen'; }
  subtitle(): string { return this.tournament()?.description ?? 'Competencia deportiva Next Gen.'; }
  organizer(): string { return this.tournament()?.organizador ?? this.tournament()?.organizer ?? 'Next Gen'; }
  place(): string { return this.tournament()?.sede ?? this.tournament()?.place ?? 'Sede por definir'; }
  selectCategory(category: string): void { this.selectedCategory.set(category); }
  matchCategory(match: TournamentMatch): string {
    return match.categoria ?? match.categoriaEquipoLocal ?? match.categoriaEquipoVisitante ?? '';
  }
  dateRange(): string {
    const tournament = this.tournament();
    const start = this.formatDate(tournament?.fechaInicio ?? tournament?.fecha_inicio);
    const end = this.formatDate(tournament?.fechaFin ?? tournament?.fecha_fin);
    return start && end ? `${start} - ${end}` : start || end || 'Fecha por definir';
  }
  time(): string {
    return formatDisplayTime(parseFormatoConfig(this.tournament()?.formato_config).horaInicioJornada) || 'Por definir';
  }
  matchDate(value: string): string { return this.formatDate(value); }
  /** Hora programada del partido ('' si la fecha no tiene hora). */
  matchTime(value: string): string { return formatDisplayTime(value); }
  teamName(match: TournamentMatch, side: 'local' | 'away'): string { return side === 'local' ? (match.nombreEquipoLocal ?? `Equipo ${match.idEquipoLocal ?? '-'}`) : (match.nombreEquipoVisitante ?? `Equipo ${match.idEquipoVisitante ?? '-'}`); }
  matchStatus(status: string | null): string {
    const value = (status ?? '').trim().toLowerCase();
    if (['finalizado', 'finalizada', 'finished', 'fin'].includes(value)) return 'Finalizado';
    if (['en_vivo', 'en vivo', 'live'].includes(value)) return 'En vivo';
    if (['cancelado', 'cancelada', 'cancelled'].includes(value)) return 'Cancelado';
    if (['por_definir', 'por definir', 'pending'].includes(value)) return 'Por definir';
    return 'Programado';
  }

  /** Resumen real de los partidos del evento (finalizados vs pendientes). */
  matchesSummary(): string {
    const matches = this.filteredMatches();
    const total = matches.length;
    if (!total) return 'Sin partidos';
    const finished = matches.filter((match) => this.isFinished(match.status)).length;
    if (finished === total) return `${total} partidos finalizados`;
    if (finished > 0) return `${finished} de ${total} partidos finalizados`;
    return `${total} partidos programados`;
  }
  matchSlug(match: TournamentMatch): string { return matchSlug(match.idPartido, match.nombreEquipoLocal, match.nombreEquipoVisitante); }

  private filterMatchesByCategory(matches: TournamentMatch[]): TournamentMatch[] {
    const category = this.selectedCategory();
    if (!category) return matches;
    return matches.filter((match) => sameCategory(this.matchCategory(match), category));
  }

  private filterStandingsByCategory(standings: TournamentStanding[]): TournamentStanding[] {
    const category = this.selectedCategory();
    const rows = category
      ? standings.filter((row) => sameCategory(row.categoria, category))
      : standings;

    return rows.map((row, index) => ({ ...row, posicion: index + 1 }));
  }

  private teamLogo(teams: AdminTeam[], idEquipo: number | null | undefined): string | null {
    const team = teams.find((item) => Number(item.idEquipo ?? item.id) === Number(idEquipo));
    return team?.logo ?? team?.image ?? null;
  }
  /** Banner del evento; si el torneo no tiene el suyo, se usa el por defecto. */
  readonly defaultBanner = DEFAULT_EVENT_BANNER;
  readonly proximamenteBanner = PROXIMAMENTE_BANNER;

  /** Torneo por anunciar: no se muestran fecha, hora ni sede. */
  comingSoon(): boolean {
    const tournament = this.tournament();
    return isProximamente(tournament?.estado ?? tournament?.status);
  }

  posterImage(): string {
    if (this.comingSoon()) return PROXIMAMENTE_BANNER;
    const tournament = this.tournament();
    return tournament?.image || tournament?.banner || DEFAULT_EVENT_BANNER;
  }

  heroBackground(): string {
    if (this.comingSoon()) return `url("${PROXIMAMENTE_BANNER}")`;
    const banner = this.tournament()?.banner ?? this.tournament()?.image;
    return `url("${banner || DEFAULT_EVENT_BANNER}")`;
  }

  get shareUrl(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nextgen.ven';
    return encodeURIComponent(`${origin}/events/${this.eventId()}`);
  }

  private formatDate(value: unknown): string {
    const iso = toDateInput(value);
    return iso ? iso.split('-').reverse().join('/') : '';
  }

  private isFinished(status: string | null | undefined): boolean {
    const value = (status ?? '').trim().toLowerCase();
    return ['finalizado', 'finalizada', 'finished', 'fin'].includes(value);
  }
}
