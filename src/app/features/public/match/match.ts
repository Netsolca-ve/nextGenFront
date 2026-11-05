import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideArrowRightLeft, LucideGoal, LucideShirt } from '@lucide/angular';
import { Matches } from '../../../@core/services/matches';
import { AdminMatch, MatchAlignment, MatchGoal, MatchSubstitution } from '../../../@core/models/match.models';
import { AdminTeam } from '../../../@core/models/team.models';
import { Teams } from '../../../@core/services/teams';
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
        teams: this.teamsService.getAllTeams(),
      }).subscribe({
        next: ({ alignments, goals, substitutions, teams }) => {
          const teamList = Array.isArray(teams) ? teams : (teams.data ?? []);
          this.match.set(toMatchView(current, alignments, goals, substitutions, teamList));
        },
        error: () => this.match.set(toMatchView(current, [], [], [], [])),
      }),
    });
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

function toMatchView(match: AdminMatch, alignments: MatchAlignment[], goals: MatchGoal[], substitutions: MatchSubstitution[], teams: AdminTeam[]): MatchView {
  const local = alignments.filter((alignment) => Number(alignment.idEquipo) === Number(match.idEquipoLocal));
  const away = alignments.filter((alignment) => Number(alignment.idEquipo) === Number(match.idEquipoVisitante));
  const localTeam = teams.find((team) => Number(team.idEquipo ?? team.id) === Number(match.idEquipoLocal));
  const awayTeam = teams.find((team) => Number(team.idEquipo ?? team.id) === Number(match.idEquipoVisitante));
  const playerName = (idJugador: number): string => {
    const player = alignments.find((item) => Number(item.idJugador) === Number(idJugador));
    return player?.nombreJugador ?? ([player?.nombre, player?.apellido].filter(Boolean).join(' ') || `Jugador #${idJugador}`);
  };
  const makeTeam = (name: string, logo: string, color: string, idEquipo: number | null, players: MatchAlignment[], side: 'home' | 'away'): MatchTeam => ({
    name,
    logo,
    color,
    lineup: players.filter((player) => isTrue(player.esTitular)).map((player, index) => ({
      number: player.numeroCamiseta ?? 0,
      name: player.nombreJugador ?? [player.nombre, player.apellido].filter(Boolean).join(' '),
      position: player.posicion ?? '',
      x: side === 'home' ? 8 + index * 9 : 92 - index * 9,
      y: [50, 27, 73, 38, 62][index] ?? 50,
    })),
    bench: players.filter((player) => !isTrue(player.esTitular)).map((player) => ({
      number: player.numeroCamiseta ?? 0,
      name: player.nombreJugador ?? [player.nombre, player.apellido].filter(Boolean).join(' '),
      position: player.posicion ?? '',
    })),
    events: [
      ...goals.filter((goal) => Number(goal.idEquipo) === Number(idEquipo)).map((goal) => ({
        minute: `${goal.minuto}'`,
        type: 'goal' as const,
        title: goal.esAutogol ? 'Autogol' : 'Gol',
        player: playerName(goal.idJugador),
      })),
      ...substitutions.filter((substitution) => Number(substitution.idEquipo) === Number(idEquipo)).map((substitution) => ({
        minute: `${substitution.minuto}'`,
        type: 'sub' as const,
        title: 'Cambio',
        player: `${playerName(substitution.idJugadorSale)} por ${playerName(substitution.idJugadorEntra)}`,
      })),
    ].sort((first, second) => Number.parseInt(first.minute, 10) - Number.parseInt(second.minute, 10)),
  });

  return {
    tournament: match.nombreTorneo ?? match.torneo?.nombre ?? 'Partido',
    round: match.fase,
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

function isTrue(value: boolean | number | string): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}
