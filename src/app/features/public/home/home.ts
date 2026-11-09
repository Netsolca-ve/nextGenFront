import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { scrollToSection } from '../../../@core/utils/scroll-to-section';
import {
  LucideArrowRight,
  LucideCalendarDays,
  LucideGraduationCap,
  LucideShieldHalf,
  LucideTrendingUp,
  LucideTrophy,
  LucideVolleyball,
} from '@lucide/angular';
import { Tournaments } from '../../../@core/services/tournaments';
import {
  AdminTournament,
  getTournamentCategories,
  sameCategory,
  TournamentMatch,
  uniqueCategories,
} from '../../../@core/models/tournament.models';
import { AdminTeam } from '../../../@core/models/team.models';
import { Teams } from '../../../@core/services/teams';
import { forkJoin } from 'rxjs';
import { matchSlug } from '../../../@core/utils/match-slug';

interface TimeLeft {
  dias: string;
  horas: string;
  minutos: string;
  segundos: string;
}

interface StandingRow {
  position: number;
  name: string;
  points: number;
  logo: string;
  category: string;
}

interface MatchTeam {
  name: string;
  logo: string;
}

interface NextMatch {
  idPartido: number;
  slug: string;
  home: MatchTeam;
  away: MatchTeam;
  date: string;
  time: string;
  homeScore: number | null;
  awayScore: number | null;
  category: string;
}

// Logo provisional mientras se cargan los escudos reales de cada equipo.
const TEAM_LOGO_PLACEHOLDER = '/images/almirantes.png';

@Component({
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideCalendarDays,
    LucideVolleyball,
    LucideTrendingUp,
    LucideShieldHalf,
    LucideGraduationCap,
    LucideTrophy,
  ],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly tournamentService = inject(Tournaments);
  private readonly teamsService = inject(Teams);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Al llegar con /#ecosystem o /#academies desde otra página. El pequeño
    // retraso deja que el router termine de llevar la página arriba primero.
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (fragment) setTimeout(() => scrollToSection(fragment), 60);
    });
  }
  nextTournament = signal<string>('');
  nextTournamentId = signal<string | number | null>(null);
  timeLeft = signal<TimeLeft>({ dias: '00', horas: '00', minutos: '00', segundos: '00' });

  standings = signal<StandingRow[]>([]);
  allStandings = signal<StandingRow[]>([]);
  categories = signal<string[]>([]);
  selectedCategory = signal('');

  nextMatch = signal<NextMatch | null>(null);
  nextMatches = signal<NextMatch[]>([]);
  firstDayMatches = signal<NextMatch[]>([]);
  allMatches = signal<NextMatch[]>([]);
  scoreboardDragging = false;
  private scoreboardDragStartX = 0;
  private scoreboardScrollStart = 0;

  private targetDate!: Date;
  private timerSubscription!: any;

  ngOnInit(): void {
    this.tournamentService.getNearestTournament().subscribe({
      next: (res: any) => {
        this.nextTournament.set(res?.nombre?.toUpperCase() || 'Sin eventos próximos');

        if (res?.fechaInicio) {
          this.targetDate = new Date(res.fechaInicio);
          this.startCountdown();
        }

        const tournamentId = res?.idTorneo ?? res?.id;
        if (tournamentId) {
          this.nextTournamentId.set(tournamentId);
          this.loadTournamentData(tournamentId, res);
        }
      },
      error: () => {
        this.nextTournament.set('Sin eventos próximos');
      },
    });
  }

  private loadTournamentData(
    tournamentId: string | number,
    tournament?: AdminTournament | null,
  ): void {
    forkJoin({
      matches: this.tournamentService.getTournamentMatches(tournamentId),
      standings: this.tournamentService.getTournamentStandings(tournamentId),
      teams: this.teamsService.getAllTeams(),
    }).subscribe({
      next: ({ matches, standings, teams }) => {
        const teamList = Array.isArray(teams) ? teams : (teams.data ?? []);
        const teamCategories = new Map<number, string>();
        for (const team of teamList) {
          const teamId = Number(team.idEquipo ?? team.id);
          const category = team.categoria ?? team.category;
          if (Number.isFinite(teamId) && category) {
            teamCategories.set(teamId, category);
          }
        }

        const allStandings = standings.map((row) => ({
          position: row.posicion,
          name: row.nombre,
          points: row.puntos,
          logo: row.logo ?? this.teamLogo(teamList, row.idEquipo),
          category: row.categoria ?? teamCategories.get(Number(row.idEquipo)) ?? '',
        }));
        this.allStandings.set(allStandings);

        const allMatches = matches
          .slice()
          .sort((a, b) => this.dateValue(a.fecha) - this.dateValue(b.fecha))
          .map((match) => this.toNextMatch(match, teamList, teamCategories));
        this.allMatches.set(allMatches);

        const categories = uniqueCategories([
          getTournamentCategories(tournament),
          allStandings.map((row) => row.category),
          allMatches.map((match) => match.category),
        ]);
        this.categories.set(categories);
        const withData =
          categories.find((category) =>
            allMatches.some((match) => sameCategory(match.category, category)),
          ) ??
          categories.find((category) =>
            allStandings.some((row) => sameCategory(row.category, category)),
          );
        this.selectedCategory.set(withData ?? categories[0] ?? '');
        this.applyCategoryFilter();
      },
      error: () => {
        this.standings.set([]);
        this.allStandings.set([]);
        this.categories.set([]);
        this.selectedCategory.set('');
        this.nextMatches.set([]);
        this.firstDayMatches.set([]);
        this.allMatches.set([]);
        this.nextMatch.set(null);
      },
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.applyCategoryFilter();
  }

  private applyCategoryFilter(): void {
    const category = this.selectedCategory();
    const standings = category
      ? this.allStandings().filter((row) => sameCategory(row.category, category))
      : this.allStandings();
    this.standings.set(
      standings.map((row, index) => ({ ...row, position: index + 1 })),
    );

    const matches = category
      ? this.allMatches().filter((match) => sameCategory(match.category, category))
      : this.allMatches();
    this.firstDayMatches.set(matches);
    this.nextMatches.set(matches.slice(0, 2));
    this.nextMatch.set(matches[0] ?? null);
  }

  private toNextMatch(
    match: TournamentMatch,
    teams: AdminTeam[],
    teamCategories: Map<number, string>,
  ): NextMatch {
    const date = new Date(match.fecha);
    return {
      idPartido: match.idPartido,
      slug: matchSlug(match.idPartido, match.nombreEquipoLocal, match.nombreEquipoVisitante),
      home: { name: match.nombreEquipoLocal ?? 'Local', logo: match.logoEquipoLocal ?? this.teamLogo(teams, match.idEquipoLocal) },
      away: { name: match.nombreEquipoVisitante ?? 'Visitante', logo: match.logoEquipoVisitante ?? this.teamLogo(teams, match.idEquipoVisitante) },
      date: Number.isNaN(date.getTime()) ? match.fecha : date.toLocaleDateString('es-VE'),
      time: Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
      homeScore: match.marcadorLocal,
      awayScore: match.marcadorVisitante,
      category:
        match.categoria ??
        match.categoriaEquipoLocal ??
        match.categoriaEquipoVisitante ??
        teamCategories.get(Number(match.idEquipoLocal)) ??
        teamCategories.get(Number(match.idEquipoVisitante)) ??
        '',
    };
  }

  private teamLogo(teams: AdminTeam[], idEquipo: number | null | undefined): string {
    const team = teams.find((item) => Number(item.idEquipo ?? item.id) === Number(idEquipo));
    return team?.logo ?? team?.image ?? TEAM_LOGO_PLACEHOLDER;
  }

  private dateValue(value: string): number {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  }

  private dateKey(value: string): string {
    const match = String(value ?? '').match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    return match ? `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}` : '';
  }

  private startCountdown(): void {
    if (!this.targetDate) return;

    this.updateTime(); // Ejecutar de inmediato la primera vez

    this.timerSubscription = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime(): void {
    if (!this.targetDate) return;

    const now = new Date().getTime();
    const distance = this.targetDate.getTime() - now;

    if (distance <= 0) {
      this.timeLeft.set({ dias: '00', horas: '00', minutos: '00', segundos: '00' });
      if (this.timerSubscription) clearInterval(this.timerSubscription);
      return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    this.timeLeft.set({
      dias: d < 10 ? `0${d}` : `${d}`,
      horas: h < 10 ? `0${h}` : `${h}`,
      minutos: m < 10 ? `0${m}` : `${m}`,
      segundos: s < 10 ? `0${s}` : `${s}`,
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      clearInterval(this.timerSubscription);
    }
  }

  startScoreboardDrag(event: PointerEvent, element: HTMLUListElement): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.scoreboardDragging = true;
    this.scoreboardDragStartX = event.clientX;
    this.scoreboardScrollStart = element.scrollLeft;
    element.setPointerCapture(event.pointerId);
  }

  moveScoreboardDrag(event: PointerEvent, element: HTMLUListElement): void {
    if (!this.scoreboardDragging) return;
    element.scrollLeft = this.scoreboardScrollStart - (event.clientX - this.scoreboardDragStartX);
  }

  endScoreboardDrag(event: PointerEvent, element: HTMLUListElement): void {
    this.scoreboardDragging = false;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  }
}
