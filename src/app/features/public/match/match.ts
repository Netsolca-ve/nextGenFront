import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideArrowRightLeft, LucideGoal, LucideShirt } from '@lucide/angular';

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
const TEAM_LOGO_PLACEHOLDER = '/images/almirantes.png';

@Component({
  imports: [RouterLink, LucideArrowLeft, LucideArrowRightLeft, LucideGoal, LucideShirt],
  selector: 'app-match',
  styleUrl: './match.scss',
  templateUrl: './match.html',
})
export class Match {
  readonly tournament = 'Torneo Futsal Cup';
  readonly round = 'Jornada 1';

  readonly homeScore = 2;
  readonly awayScore = 3;
  readonly clock = '14:32';
  readonly period = '2T';

  readonly home: MatchTeam = {
    name: 'ALMIRANTES',
    logo: TEAM_LOGO_PLACEHOLDER,
    color: '#0094DD',
    lineup: [
      { number: 1, name: 'Rojas', position: 'POR', x: 8, y: 50 },
      { number: 4, name: 'Vargas', position: 'DEF', x: 23, y: 50 },
      { number: 6, name: 'Díaz', position: 'ALA', x: 35, y: 27 },
      { number: 8, name: 'Herrera', position: 'ALA', x: 35, y: 73 },
      { number: 10, name: 'Mendoza', position: 'PIV', x: 45, y: 50 },
    ],
    bench: [
      { number: 12, name: 'López', position: 'POR' },
      { number: 15, name: 'Ruiz', position: 'DEF' },
      { number: 18, name: 'Torres', position: 'ALA' },
      { number: 20, name: 'Castro', position: 'PIV' },
      { number: 22, name: 'Vargas', position: 'ALA' },
    ],
    events: [
      { minute: "14'", type: 'goal', title: 'Gol', player: 'Ramírez' },
      { minute: "09'", type: 'sub', title: 'Cambio', player: 'Entra Díaz · Sale Mendoza' },
      { minute: "05'", type: 'goal', title: 'Gol', player: 'Herrera' },
    ],
  };

  readonly away: MatchTeam = {
    name: 'RAYOS',
    logo: TEAM_LOGO_PLACEHOLDER,
    color: '#E23B3B',
    lineup: [
      { number: 1, name: 'Álvarez', position: 'POR', x: 92, y: 50 },
      { number: 4, name: 'Pérez', position: 'DEF', x: 77, y: 50 },
      { number: 7, name: 'González', position: 'ALA', x: 65, y: 27 },
      { number: 5, name: 'Hernández', position: 'ALA', x: 65, y: 73 },
      { number: 9, name: 'Martínez', position: 'PIV', x: 55, y: 50 },
    ],
    bench: [
      { number: 12, name: 'Ramos', position: 'POR' },
      { number: 14, name: 'Morales', position: 'DEF' },
      { number: 16, name: 'Benítez', position: 'ALA' },
      { number: 18, name: 'Rojas', position: 'PIV' },
      { number: 20, name: 'Torres', position: 'ALA' },
    ],
    events: [
      { minute: "15'", type: 'goal', title: 'Gol', player: 'Pérez' },
      { minute: "12'", type: 'yellow', title: 'Tarjeta amarilla', player: 'Hernández' },
      { minute: "03'", type: 'goal', title: 'Gol', player: 'Martínez' },
      { minute: "01'", type: 'goal', title: 'Gol', player: 'González' },
    ],
  };
}
