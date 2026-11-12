import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
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
  parseFormatoConfig,
  uniqueCategories,
} from '../../../@core/models/tournament.models';
import { AdminTeam } from '../../../@core/models/team.models';
import { Teams } from '../../../@core/services/teams';
import { forkJoin } from 'rxjs';
import { matchSlug } from '../../../@core/utils/match-slug';
import { dateTimestamp, formatDisplayDate, formatDisplayTime, toLocalDate } from '../../../@core/utils/datetime';

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
const TEAM_LOGO_PLACEHOLDER = '/images/almirantes.webp';

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
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.preloadHeroImage();

    // Al llegar con /#ecosystem o /#academies desde otra página. El pequeño
    // retraso deja que el router termine de llevar la página arriba primero.
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (fragment) setTimeout(() => scrollToSection(fragment), 60);
    });
  }
  nextTournament = signal<string>('Cargando...');
  nextTournamentId = signal<string | number | null>(null);
  /** Nombre del torneo próximo: encabezado de las tarjetas de partidos. */
  tournamentName = signal<string>('');
  timeLeft = signal<TimeLeft>({ dias: '00', horas: '00', minutos: '00', segundos: '00' });
  /**
   * Estado del torneo destacado (lo calcula el backend por fechas): contador
   * si es próximo, "en curso" mientras se juega y "finalizado" si ya no hay
   * otro torneo por venir.
   */
  eventState = signal<'PROXIMO' | 'EN_CURSO' | 'FINALIZADO' | 'PROXIMAMENTE' | null>(null);
  eventDates = signal('');
  eventLabel = computed(() => {
    const labels = { EN_CURSO: 'EVENTO EN CURSO', FINALIZADO: 'EVENTO FINALIZADO', PROXIMAMENTE: 'PRÓXIMAMENTE' };
    const state = this.eventState();
    return state && state !== 'PROXIMO' ? labels[state] : 'PRÓXIMO EVENTO';
  });

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

  /**
   * El fondo del hero es el LCP del home. Al agregarlo al <head> durante el
   * prerender, el navegador lo descarga antes de leer el CSS. Solo en el home
   * para no bajar la imagen en las demás páginas.
   */
  private preloadHeroImage(): void {
    const href = '/images/hero.webp';
    if (this.document.head.querySelector(`link[rel="preload"][href="${href}"]`)) return;

    const link = this.document.createElement('link');
    // setAttribute: el DOM del prerender no serializa propiedades como `as`
    link.setAttribute('rel', 'preload');
    link.setAttribute('as', 'image');
    link.setAttribute('href', href);
    link.setAttribute('fetchpriority', 'high');
    this.document.head.appendChild(link);
  }

  ngOnInit(): void {
    this.tournamentService.getNearestTournament().subscribe({
      next: (res: any) => {
        this.nextTournament.set(res?.nombre?.toUpperCase() || 'Sin eventos próximos');
        this.tournamentName.set(res?.nombre ?? '');

        this.eventState.set(res?.estadoCalendario ?? null);
        this.eventDates.set(
          [formatDisplayDate(res?.fechaInicio), formatDisplayDate(res?.fechaFin)]
            .filter(Boolean)
            .join(' – '),
        );

        if (res?.fechaInicio && res?.estadoCalendario === 'PROXIMO') {
          // Cuenta hasta la hora de inicio de la jornada del primer día. Fecha
          // guardada 'YYYY-MM-DD': se toma en hora local (no en UTC, que habría
          // mostrado el evento un día antes)
          const hora = parseFormatoConfig(res.formato_config).horaInicioJornada ?? '00:00';
          this.targetDate = toLocalDate(`${res.fechaInicio} ${hora}`) ?? new Date();
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
    return {
      idPartido: match.idPartido,
      slug: matchSlug(match.idPartido, match.nombreEquipoLocal, match.nombreEquipoVisitante),
      home: { name: match.nombreEquipoLocal ?? 'Local', logo: match.logoEquipoLocal ?? this.teamLogo(teams, match.idEquipoLocal) },
      away: { name: match.nombreEquipoVisitante ?? 'Visitante', logo: match.logoEquipoVisitante ?? this.teamLogo(teams, match.idEquipoVisitante) },
      // Se leen directo del string guardado: sin new Date(), que restaba un día
      date: formatDisplayDate(match.fecha) || match.fecha,
      time: formatDisplayTime(match.fecha),
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
    return dateTimestamp(value);
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
      // Empezó el torneo con la página abierta
      if (this.eventState() === 'PROXIMO') this.eventState.set('EN_CURSO');
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
