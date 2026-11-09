export const TEAM_CATEGORIES = ['SUB-9', 'SUB-10', 'SUB-12', 'SUB-14', 'SUB-16'] as const;

export const IDENTIFICATION_TYPES = [
  { value: 'V', label: 'V - Cédula' },
  { value: 'E', label: 'E - Extranjero' },
  { value: 'P', label: 'P - Pasaporte' },
  { value: 'J', label: 'J - RIF' },
] as const;

export const PLAYER_POSITIONS = ['Portero', 'Jugador'] as const;

/** true si la posición guardada corresponde a un portero. */
export function isGoalkeeper(posicion: string | null | undefined): boolean {
  const value = (posicion ?? '').trim().toLowerCase();
  return ['portero', 'arquero', 'gk', 'goalkeeper'].includes(value);
}

/**
 * Solo distinguimos Portero / Jugador. Las posiciones antiguas
 * (Cierre, Ala, Pívot...) se muestran como "Jugador".
 */
export function positionLabel(posicion: string | null | undefined): 'Portero' | 'Jugador' {
  return isGoalkeeper(posicion) ? 'Portero' : 'Jugador';
}

export interface AcademyOption {
  idAcademia: number;
  nombre: string;
  nombreCorto?: string | null;
  logo?: string | null;
}

export interface CoachOption {
  idEntrenador: number;
  nombre: string;
  apellido: string;
  especialidad?: string | null;
  idAcademia?: number | null;
  nombreAcademia?: string | null;
}

export interface AdminTeam {
  idEquipo?: number;
  id?: string | number;
  nombre?: string;
  name?: string;
  slug?: string;
  siglas?: string;
  categoria?: string;
  category?: string;
  logo?: string | null;
  image?: string | null;
  colorLocal?: string;
  colorVisitante?: string;
  horarioEntrenamientos?: string | null;
  diasEntrenamientos?: string | null;
  idAcademia?: number | null;
  nombreAcademia?: string | null;
  idEntrenador?: number | null;
  nombreEntrenador?: string | null;
  totalJugadores?: number | string;
  members?: number | string;
  coach?: string;
  entrenador?: string;
}

export interface TeamInput {
  nombre: string;
  siglas: string;
  categoria: string;
  logo?: string | null;
  colorLocal?: string;
  colorVisitante?: string;
  horarioEntrenamientos?: string | null;
  diasEntrenamientos?: string | null;
  idAcademia?: number | null;
  idEntrenador?: number | null;
}

export interface TeamPlayer {
  idJugador: number;
  nombre: string;
  apellido: string;
  tipoIdentificacion: string | null;
  identificacion: string | null;
  fechaNacimiento: string;
  numeroCamiseta: number | null;
  foto: string | null;
  posicion: string | null;
  idEquipo: number;
}

export interface CreatePlayerInput {
  nombre: string;
  apellido: string;
  tipoIdentificacion?: string;
  identificacion?: string;
  fechaNacimiento: string;
  numeroCamiseta: number;
  foto?: string;
  posicion?: string;
}
