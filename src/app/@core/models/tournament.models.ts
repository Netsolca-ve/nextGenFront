/** Banner por defecto de los eventos cuando el torneo no tiene uno propio. */
export const DEFAULT_EVENT_BANNER = '/images/bannerEvento.jpg';

/** Imagen de los torneos aún no anunciados (estado PROXIMAMENTE). */
export const PROXIMAMENTE_BANNER = '/images/proximamente.webp';

export const TORNEO_TIPOS = [
  { value: 'ROUND_ROBIN_CON_FINALES', label: 'Todos contra todos con finales' },
  { value: 'ROUND_ROBIN', label: 'Todos contra todos (sin finales)' },
  { value: 'ELIMINACION_DIRECTA', label: 'Eliminación directa' },
] as const;

export const TORNEO_ESTATOS = [
  { value: 'PROXIMAMENTE', label: 'Próximamente' },
  { value: 'PROGRAMADO', label: 'Próximo' },
  { value: 'INSCRIPCIONES_ABIERTAS', label: 'Inscripciones abiertas' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'FINALIZADO', label: 'Finalizado' },
] as const;

/** Normaliza un estado ("PRÓXIMO", "Próximo", "PROXIMAMENTE"...) a minúsculas y sin acentos. */
export function normalizeEstado(estado?: string | null): string {
  return (estado ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

/** Un torneo está "por anunciarse" cuando su estado es PROXIMAMENTE. */
export function isProximamente(estado?: string | null): boolean {
  return normalizeEstado(estado) === 'proximamente';
}

export const CRITERIOS_DESEMPATE = [
  { value: 'DIFERENCIA_DE_GOLES', label: 'Diferencia de goles' },
  { value: 'GOLES_A_FAVOR', label: 'Goles a favor' },
  { value: 'PARTIDOS_GANADOS', label: 'Partidos ganados' },
  { value: 'VALLAS_INVICTAS', label: 'Vallas invictas' },
  { value: 'SORTEO', label: 'Sorteo' },
] as const;

export const DEFINICIONES_EMPATE = [
  { value: 'PENALES', label: 'Penales' },
  { value: 'TIEMPO_EXTRA', label: 'Tiempo extra' },
  { value: 'MONEDA_AL_AIRE', label: 'Moneda al aire' },
] as const;

export interface PuntuacionConfig {
  victoria: number;
  empate: number;
  derrota: number;
}

export interface CruceConfig {
  fase: string;
  nombre: string;
  local: string;
  visitante: string;
}

export interface FaseGruposConfig {
  nombre: string;
  descripcion: string;
  totalJornadas: number;
  permiteEmpate: boolean;
  puntuacion: PuntuacionConfig;
}

export interface FaseDefinitoriaConfig {
  nombre: string;
  permiteEmpate: boolean;
  definicionEmpate: string;
  cruces: CruceConfig[];
}

/** Configuración completa del torneo que se guarda en la columna JSON `formato_config`. */
export interface TournamentFormatConfig {
  organizer?: string;
  place?: string;
  description?: string;
  tipoTorneo: string;
  totalEquipos: number;
  categoriasHabilitadas: string[];
  diasJuego: string[];
  canchas: string[];
  horaInicioJornada: string;
  tiemposPorPartido: number;
  duracionTiempoMinutos: number;
  duracionDescansoMinutos: number;
  fases: {
    fase1: FaseGruposConfig;
    faseDefinitoria: FaseDefinitoriaConfig;
  };
  criteriosDesempate: string[];
}

/** Payload enviado a POST/PUT /tournaments */
export interface TournamentInput {
  nombre: string;
  categoria: string;
  banner?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  status?: string;
  equiposIds: number[];
  duracionTiempoMinutos?: number;
  duracionDescansoMinutos?: number;
  formato_config: Partial<TournamentFormatConfig>;
}

export function createDefaultFormatoConfig(): TournamentFormatConfig {
  return {
    tipoTorneo: 'ROUND_ROBIN_CON_FINALES',
    totalEquipos: 4,
    categoriasHabilitadas: [],
    diasJuego: [],
    canchas: ['Cancha Principal'],
    horaInicioJornada: '08:30',
    tiemposPorPartido: 2,
    duracionTiempoMinutos: 20,
    duracionDescansoMinutos: 5,
    fases: {
      fase1: {
        nombre: 'TODOS_CONTRA_TODOS',
        descripcion: 'Round Robin simple',
        totalJornadas: 3,
        permiteEmpate: true,
        puntuacion: { victoria: 3, empate: 1, derrota: 0 },
      },
      faseDefinitoria: {
        nombre: 'FASE_DEFINITORIA',
        permiteEmpate: false,
        definicionEmpate: 'PENALES',
        cruces: [
          { fase: 'FINAL', nombre: 'Gran Final', local: 'POSICION_1', visitante: 'POSICION_2' },
          {
            fase: 'TERCER_LUGAR',
            nombre: 'Definición Tercer Lugar',
            local: 'POSICION_3',
            visitante: 'POSICION_4',
          },
        ],
      },
    },
    criteriosDesempate: CRITERIOS_DESEMPATE.map((criterio) => criterio.value),
  };
}

/** `formato_config` llega desde MySQL como string JSON: se parsea de forma segura. */
export function parseFormatoConfig(value: unknown): Partial<TournamentFormatConfig> {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Partial<TournamentFormatConfig>;
    } catch {
      return {};
    }
  }

  return typeof value === 'object' ? (value as Partial<TournamentFormatConfig>) : {};
}

/** Normaliza fechas que llegan como Date/ISO de MySQL a 'YYYY-MM-DD'. */
export function toDateInput(value: unknown): string {
  if (!value) {
    return '';
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const date = value instanceof Date ? value : new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Fila devuelta por GET /tournaments (aliases en ES/EN por compatibilidad). */
export interface AdminTournament {
  id?: string | number;
  idTorneo?: number;
  name?: string;
  nombre?: string;
  organizer?: string;
  organizador?: string;
  place?: string;
  sede?: string;
  startDate?: string;
  fechaInicio?: string;
  fecha_inicio?: string;
  endDate?: string;
  fechaFin?: string;
  fecha_fin?: string;
  status?: string;
  estado?: string;
  categoria?: string;
  categories?: string[];
  categorias?: string[];
  slots?: number | string;
  cupo?: number | string;
  description?: string;
  banner?: string;
  image?: string;
  formato_config?: unknown;
  totalEquipos?: number;
  totalPartidos?: number;
}

/** Normaliza una categoría para comparar "SUB-12", "SUB 12" y "sub12". */
export function normalizeCategory(value?: string | null): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Compara dos categorías sin depender de espacios, guiones o mayúsculas. */
export function sameCategory(first?: string | null, second?: string | null): boolean {
  const firstKey = normalizeCategory(first);
  const secondKey = normalizeCategory(second);
  return Boolean(firstKey && secondKey && firstKey === secondKey);
}

/** Une categorías eliminando duplicados normalizados y conservando la etiqueta original. */
export function uniqueCategories(
  values: Array<string | null | undefined | Array<string | null | undefined>>,
): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];

  for (const value of values) {
    const items = Array.isArray(value) ? value : [value];

    for (const item of items) {
      const label = String(item ?? '').trim();
      const key = normalizeCategory(label);
      if (!key || seen.has(key)) continue;

      seen.add(key);
      categories.push(label);
    }
  }

  return categories;
}

/** Categorías configuradas en un torneo, con compatibilidad para datos antiguos. */
export function getTournamentCategories(tournament?: AdminTournament | null): string[] {
  if (!tournament) return [];

  const config = parseFormatoConfig(tournament.formato_config);
  const legacy = typeof tournament.categoria === 'string' ? tournament.categoria.split(',') : [];

  return uniqueCategories([
    config.categoriasHabilitadas,
    tournament.categorias,
    tournament.categories,
    legacy,
  ]);
}

export interface TournamentMatch {
  idPartido: number;
  fase: string;
  numeroRonda: number | null;
  fecha: string;
  idEquipoLocal: number | null;
  idEquipoVisitante: number | null;
  marcadorLocal: number | null;
  marcadorVisitante: number | null;
  status: string | null;
  categoria?: string | null;
  categoriaEquipoLocal?: string | null;
  categoriaEquipoVisitante?: string | null;
  nombreEquipoLocal?: string;
  nombreEquipoVisitante?: string;
  logoEquipoLocal?: string | null;
  logoEquipoVisitante?: string | null;
}

export interface TournamentStanding {
  posicion: number;
  idEquipo: number;
  nombre: string;
  partidosJugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  vallasInvictas?: number;
  puntos: number;
  logo?: string | null;
  categoria?: string | null;
}
