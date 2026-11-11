import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideArrowRightLeft, LucideGoal, LucideShirt } from '@lucide/angular';
import { Matches } from '../../../@core/services/matches';
import { AdminMatch, MatchAlignment, MatchGoal, MatchIncident, MatchSubstitution } from '../../../@core/models/match.models';
import { AdminTeam, isGoalkeeper, positionLabel } from '../../../@core/models/team.models';
import { Teams } from '../../../@core/services/teams';
import { SeoService } from '../../../@core/services/seo';
import { matchIdFromSlug } from '../../../@core/utils/match-slug';
import { forkJoin } from 'rxjs';

export type MatchEventType = 'goal' | 'yellow' | 'red' | 'sub';

export interface LineupPlayer {
  number: number;
  name: string;
  position: string;
  /** Posición en la cancha (porcentaje). */
  x: number;
  y: number;
}

export interface BenchPlayer {
  number: number;
  name: string;
  position: string;
}

export interface MatchEvent {
  minute: string;
  type: MatchEventType;
  title: string;
  player: string;
}

export interface MatchTeam {
  name: string;
  logo: string;
  color: string;
  lineup: LineupPlayer[];
  bench: BenchPlayer[];
  events: MatchEvent[];
}

// Logo provisional mientras se cargan los escudos reales de cada equipo.
@Component({
  imports: [RouterLink, LucideArrowLeft, LucideArrowRightLeft, LucideGoal, LucideShirt],
  selector: 'app-match',
  styleUrl: './match.scss',
  templateUrl: './match.html',
})
export class Match {
  private readonly matchesService = inject(Matches);
  private readonly teamsService = inject(Teams);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly match = signal<MatchView>(emptyMatch());

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const idPartido = matchIdFromSlug(params.get('slug'));
      if (idPartido) this.loadMatch(idPartido);
    });
  }

  private loadMatch(idPartido: number): void {
    this.matchesService.getMatch(idPartido).subscribe({
      next: (current) => forkJoin({
        alignments: this.matchesService.getAlignments(idPartido),
        goals: this.matchesService.getGoals(idPartido),
        substitutions: this.matchesService.getSubstitutions(idPartido),
        cards: this.matchesService.getCards(idPartido),
        teams: this.teamsService.getAllTeams(),
      }).subscribe({
        next: ({ alignments, goals, substitutions, cards, teams }) => {
          const teamList = Array.isArray(teams) ? teams : (teams.data ?? []);
          const view = toMatchView(current, alignments, goals, substitutions, teamList, cards);
          this.match.set(view);
          this.applySeo(view);
        },
        error: () => {
          const view = toMatchView(current, [], [], [], []);
          this.match.set(view);
          this.applySeo(view);
        },
      }),
    });
  }

  private applySeo(view: MatchView): void {
    const title = `${view.home.name} vs ${view.away.name} | Next Gen Venezuela`;
    const description = `${view.tournament} · ${view.round}. Resultado, alineaciones, goles y sustituciones.`;
    this.seo.setPage(title, description);
  }

  get tournament(): string { return this.match().tournament; }
  get round(): string { return this.match().round; }
  get homeScore(): number { return this.match().homeScore; }
  get awayScore(): number { return this.match().awayScore; }
  get clock(): string { return this.match().clock; }
  get period(): string { return this.match().period; }
  get statusLabel(): string {
    const status = this.match().status.trim().toLowerCase();
    if (['live', 'en_vivo', 'en vivo'].includes(status)) return 'EN VIVO';
    if (['finished', 'finalizado', 'finalizada', 'fin'].includes(status)) return 'FINALIZADO';
    if (['cancelled', 'cancelado', 'cancelada'].includes(status)) return 'CANCELADO';
    if (['postponed', 'aplazado', 'aplazada'].includes(status)) return 'APLAZADO';
    return 'PROGRAMADO';
  }
  get home(): MatchTeam { return this.match().home; }
  get away(): MatchTeam { return this.match().away; }

  jerseyNumberClass(color: string): string {
    return this.isLightColor(color) ? 'jerseyNum jerseyNum--dark' : 'jerseyNum';
  }

  private isLightColor(color: string): boolean {
    const hex = color.replace('#', '').trim();
    if (!/^[\da-f]{3}$|^[\da-f]{6}$/i.test(hex)) return false;
    const normalized = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    return (red * 299 + green * 587 + blue * 114) / 1000 >= 180;
  }
}

interface MatchView {
  tournament: string;
  round: string;
  homeScore: number;
  awayScore: number;
  clock: string;
  period: string;
  status: string;
  home: MatchTeam;
  away: MatchTeam;
}

function emptyMatch(): MatchView {
  return {
    tournament: 'Partido', round: '', homeScore: 0, awayScore: 0, clock: '', period: '', status: 'programado',
    home: emptyTeam('Local', '#0094DD'), away: emptyTeam('Visitante', '#E23B3B'),
  };
}

function emptyTeam(name: string, color: string): MatchTeam {
  return { name, logo: '', color, lineup: [], bench: [], events: [] };
}

function formatMinute(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  return `${value}'`;
}

/** Ordena por minuto y deja al final los eventos sin minuto. */
function minuteOrder(event: { minute: string }): number {
  const minute = Number.parseInt(event.minute, 10);
  return Number.isFinite(minute) ? minute : Number.MAX_SAFE_INTEGER;
}

function toMatchView(match: AdminMatch, alignments: MatchAlignment[], goals: MatchGoal[], substitutions: MatchSubstitution[], teams: AdminTeam[], cards: MatchIncident[] = []): MatchView {
  const local = alignments.filter((alignment) => Number(alignment.idEquipo) === Number(match.idEquipoLocal));
  const away = alignments.filter((alignment) => Number(alignment.idEquipo) === Number(match.idEquipoVisitante));
  const localTeam = teams.find((team) => Number(team.idEquipo ?? team.id) === Number(match.idEquipoLocal));
  const awayTeam = teams.find((team) => Number(team.idEquipo ?? team.id) === Number(match.idEquipoVisitante));
  const playerName = (idJugador: number | null | undefined, fallback?: { nombreJugador?: string | null; apellidoJugador?: string | null }): string => {
    const player = alignments.find((item) => Number(item.idJugador) === Number(idJugador));
    if (player) return player.nombreJugador ?? ([player.nombre, player.apellido].filter(Boolean).join(' ') || `Jugador #${idJugador}`);
    const fromApi = [fallback?.nombreJugador, fallback?.apellidoJugador].filter(Boolean).join(' ');
    return fromApi || (idJugador ? `Jugador #${idJugador}` : '');
  };
  // Un autogol lo comete un jugador de un equipo pero suma al rival:
  // se muestra del lado contrario y sin el nombre de quien lo hizo.
  const goalBelongsTo = (goal: MatchGoal, idEquipo: number | null): boolean => {
    const scoredBy = Number(goal.idEquipo);
    return isTrue(goal.esAutogol) ? scoredBy !== Number(idEquipo) : scoredBy === Number(idEquipo);
  };
  const makeTeam = (name: string, logo: string, color: string, idEquipo: number | null, players: MatchAlignment[], side: 'home' | 'away'): MatchTeam => ({
    name,
    logo,
    color,
    lineup: buildLineup(players.filter((player) => isTrue(player.esTitular)), side),
    bench: players.filter((player) => !isTrue(player.esTitular)).map((player) => ({
      number: player.numeroCamiseta ?? 0,
      name: player.nombreJugador ?? [player.nombre, player.apellido].filter(Boolean).join(' '),
      position: positionLabel(player.posicion),
    })),
    events: [
      ...goals.filter((goal) => goalBelongsTo(goal, idEquipo)).map((goal) => ({
        minute: formatMinute(goal.minuto),
        type: 'goal' as const,
        title: isTrue(goal.esAutogol) ? 'Autogol' : 'Gol',
        player: isTrue(goal.esAutogol) ? '' : playerName(goal.idJugador, goal),
      })),
      ...cards.filter((card) => Number(card.idEquipo) === Number(idEquipo) && cardType(card.tipo)).map((card) => {
        const type = cardType(card.tipo)!;
        return {
          minute: formatMinute(card.minuto),
          type,
          title: type === 'yellow' ? 'Tarjeta amarilla' : 'Tarjeta roja',
          player: card.idJugador ? playerName(card.idJugador, card) : (card.descripcion ?? ''),
        };
      }),
      ...substitutions.filter((substitution) => Number(substitution.idEquipo) === Number(idEquipo)).map((substitution) => ({
        minute: formatMinute(substitution.minuto),
        type: 'sub' as const,
        title: 'Cambio',
        player: `${playerName(substitution.idJugadorSale)} por ${playerName(substitution.idJugadorEntra)}`,
      })),
    ].sort((first, second) => minuteOrder(first) - minuteOrder(second)),
  });

  return {
    tournament: match.nombreTorneo ?? match.torneo?.nombre ?? 'Partido',
    round: faseLabel(match.fase),
    homeScore: match.marcadorLocal ?? 0,
    awayScore: match.marcadorVisitante ?? 0,
    clock: '',
    period: '',
    status: match.status ?? 'programado',
    home: makeTeam(
      match.nombreEquipoLocal ?? match.equipoLocal?.nombre ?? 'Local',
      match.logoEquipoLocal ?? match.equipoLocal?.logo ?? localTeam?.logo ?? localTeam?.image ?? '',
      match.colorLocal ?? match.equipoLocal?.colorLocal ?? localTeam?.colorLocal ?? '#0094DD',
      match.idEquipoLocal,
      local,
      'home',
    ),
    away: makeTeam(
      match.nombreEquipoVisitante ?? match.equipoVisitante?.nombre ?? 'Visitante',
      match.logoEquipoVisitante ?? match.equipoVisitante?.logo ?? awayTeam?.logo ?? awayTeam?.image ?? '',
      match.colorVisitante ?? match.equipoVisitante?.colorVisitante ?? awayTeam?.colorVisitante ?? '#E23B3B',
      match.idEquipoVisitante,
      away,
      'away',
    ),
  };
}

/** Portería de cada equipo (mitad izquierda = local). */
const GOALKEEPER_SLOT = { x: 7, y: 50 };

/**
 * Formación fija para los jugadores de campo (rombo 1-2-1 de futsal),
 * siempre igual sin importar el orden en que se marquen los titulares.
 * Si hay más de 4 jugadores de campo se usan los huecos extra.
 */
const FIELD_SLOTS = [
  { x: 19, y: 50 },
  { x: 30, y: 22 },
  { x: 30, y: 78 },
  { x: 42, y: 50 },
  { x: 40, y: 26 },
  { x: 40, y: 74 },
];

function buildLineup(starters: MatchAlignment[], side: 'home' | 'away'): LineupPlayer[] {
  const byNumber = (a: MatchAlignment, b: MatchAlignment) => (a.numeroCamiseta ?? 999) - (b.numeroCamiseta ?? 999);
  const goalkeeperIndex = starters.findIndex((player) => isGoalkeeper(player.posicion));
  const goalkeeper = goalkeeperIndex >= 0 ? starters[goalkeeperIndex] : null;
  const fieldPlayers = starters.filter((_, index) => index !== goalkeeperIndex).sort(byNumber);
  const mirror = (x: number) => (side === 'home' ? x : 100 - x);
  const toPlayer = (player: MatchAlignment, slot: { x: number; y: number }, position: string): LineupPlayer => ({
    number: player.numeroCamiseta ?? 0,
    name: player.nombreJugador ?? [player.nombre, player.apellido].filter(Boolean).join(' '),
    position,
    x: mirror(slot.x),
    y: slot.y,
  });

  return [
    ...(goalkeeper ? [toPlayer(goalkeeper, GOALKEEPER_SLOT, 'Portero')] : []),
    ...fieldPlayers.map((player, index) => toPlayer(player, FIELD_SLOTS[index] ?? { x: 36, y: 50 }, 'Jugador')),
  ];
}

/** Normaliza el tipo de tarjeta que devuelva el backend. */
function cardType(tipo: string | null | undefined): 'yellow' | 'red' | null {
  const value = (tipo ?? '').toString().trim().toLowerCase();
  if (['yellow', 'amarilla', 'tarjeta_amarilla', 'a'].includes(value)) return 'yellow';
  if (['red', 'roja', 'tarjeta_roja', 'r'].includes(value)) return 'red';
  return null;
}

/** Etiqueta en español de la fase de un partido. */
function faseLabel(fase: string | null | undefined): string {
  const labels: Record<string, string> = {
    GRUPO: 'Fase de grupos',
    SEMI_FINAL: 'Semifinal',
    TERCER_LUGAR: 'Tercer lugar',
    FINAL: 'Gran Final',
  };
  return labels[fase ?? ''] ?? fase ?? '';
}

function isTrue(value: boolean | number | string | null | undefined): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}
