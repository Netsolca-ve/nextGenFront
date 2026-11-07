export type MatchStatus = 'programado' | 'en_vivo' | 'finalizado' | string;
export type MatchEventType = 'goal' | 'yellow' | 'red' | 'sub';

export interface AdminMatch {
  idPartido: number;
  fase: string;
  numeroRonda: number | null;
  marcadorLocal: number | null;
  marcadorVisitante: number | null;
  marcadorPenalesLocal: number | null;
  marcadorPenalesVisitante: number | null;
  duracionTiempoMinutos: number;
  duracionDescansoMinutos: number;
  tieneTiempoExtra: boolean | number | null;
  duracionExtraMinutos: number | null;
  tieneTandaPenales: boolean | number | null;
  status: MatchStatus | null;
  ganador: number | null;
  fecha: string;
  direccion: string | null;
  idTorneo: number;
  idEquipoLocal: number | null;
  idEquipoVisitante: number | null;
  nombreTorneo?: string;
  nombreEquipoLocal?: string;
  nombreEquipoVisitante?: string;
  logoEquipoLocal?: string | null;
  logoEquipoVisitante?: string | null;
  colorLocal?: string | null;
  colorVisitante?: string | null;
  categoria?: string;
  torneo?: { nombre?: string; categoria?: string };
  equipoLocal?: { nombre?: string; logo?: string; colorLocal?: string };
  equipoVisitante?: { nombre?: string; logo?: string; colorVisitante?: string };
}

export interface MatchAlignment {
  idAlineacionPartido: number;
  esTitular: boolean | number;
  esCapitan: boolean | number;
  numeroCamiseta: number | null;
  posicion: string | null;
  idPartido: number;
  idEquipo: number;
  idJugador: number;
  nombreJugador?: string;
  nombre?: string;
  apellido?: string;
  convocado?: boolean;
}

export interface MatchIncident {
  id?: number;
  tipo: MatchEventType;
  minuto: number | string | null;
  idEquipo: number;
  idJugador?: number | null;
  descripcion?: string | null;
}

export interface MatchGoal {
  idGol?: number;
  minuto: number | string | null;
  esAutogol: boolean | number;
  idPartido?: number;
  idJugador: number;
  idJugadorAsistencia?: number | null;
  idEquipo: number;
}

export interface MatchSubstitution {
  idSustitucionPartido?: number;
  minuto: number | string | null;
  periodo: number | string;
  idPartido?: number;
  idEquipo: number;
  idJugadorSale: number;
  idJugadorEntra: number;
}

export interface MatchUpdateInput {
  fase?: string;
  numeroRonda?: number | null;
  marcadorLocal: number | null;
  marcadorVisitante: number | null;
  marcadorPenalesLocal?: number | null;
  marcadorPenalesVisitante?: number | null;
  status?: MatchStatus | null;
  ganador?: number | null;
  fecha?: string;
  tieneTiempoExtra?: boolean | number | null;
  tieneTandaPenales?: boolean | number | null;
  tarjetas?: MatchIncident[];
}

export interface MatchAlignmentUpdate {
  idAlineacionPartido: number;
  idPartido: number;
  idEquipo: number;
  idJugador: number;
  esTitular: boolean;
  esCapitan: boolean;
  numeroCamiseta: number | null;
  posicion: string | null;
}

export type MatchAlignmentCreate = Omit<MatchAlignmentUpdate, 'idAlineacionPartido'>;
