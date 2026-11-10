/**
 * Utilidades de fecha para leer los strings que devuelve el backend.
 *
 * El backend guarda y devuelve fechas como "hora local de pared"
 * ('YYYY-MM-DD' o 'YYYY-MM-DD HH:MM:SS'), sin zona horaria. Aquí NUNCA se
 * pasa por `new Date(string) + getters locales` cuando el string ya trae la
 * fecha, porque eso (o un ISO con Z) hacía que los partidos "se corrieran un
 * día" en el navegador.
 */

/**
 * Valor de un control de fecha u hora: string del backend ('YYYY-MM-DD',
 * 'HH:MM') al cargar, Date cuando el usuario elige en el datepicker/timepicker.
 */
export type DateValue = Date | string | null;

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Lee las partes de una fecha sin interpretar zona horaria. */
export function splitDate(value: unknown): DateParts | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : {
          year: value.getFullYear(),
          month: value.getMonth() + 1,
          day: value.getDate(),
          hours: value.getHours(),
          minutes: value.getMinutes(),
          seconds: value.getSeconds(),
        };
  }

  const raw = String(value).trim();

  // 'YYYY-MM-DD[THH:mm[:SS]]...' — se toma el prefijo tal cual, ignorando
  // cualquier sufijo de zona horaria (Z/uOffset): es la fecha guardada.
  const iso = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
      hours: Number(iso[4] ?? 0),
      minutes: Number(iso[5] ?? 0),
      seconds: Number(iso[6] ?? 0),
    };
  }

  // 'dd/mm/yyyy' o 'dd-mm-yyyy'
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) {
    return {
      year: Number(dmy[3]),
      month: Number(dmy[2]),
      day: Number(dmy[1]),
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return null;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** 'YYYY-MM-DD' (para inputs type="date"). */
export function toDateOnly(value: unknown): string {
  const parts = splitDate(value);
  if (!parts) return '';
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** 'YYYY-MM-DDTHH:MM' (para inputs type="datetime-local"). */
export function toDateTimeOnly(value: unknown): string {
  const parts = splitDate(value);
  if (!parts) return '';
  return `${toDateOnly(value)}T${pad(parts.hours)}:${pad(parts.minutes)}`;
}

/** 'dd/mm/yyyy' para mostrar al usuario. */
export function formatDisplayDate(value: unknown): string {
  const parts = splitDate(value);
  if (!parts) return '';
  return `${pad(parts.day)}/${pad(parts.month)}/${parts.year}`;
}

const VE_TIME = new Intl.DateTimeFormat('es-VE', { hour: 'numeric', minute: '2-digit' });
const VE_WEEKDAY = new Intl.DateTimeFormat('es-VE', { weekday: 'short' });

/**
 * Hora como se usa en Venezuela: "8:30 a. m." ('' si la fecha no tiene hora).
 * Acepta una fecha con hora o solo la hora ('08:30').
 */
export function formatDisplayTime(value: unknown): string {
  const clock = typeof value === 'string' ? value.trim().match(/^(\d{1,2}):(\d{2})/) : null;
  if (clock) return VE_TIME.format(new Date(2000, 0, 1, Number(clock[1]), Number(clock[2])));

  const parts = splitDate(value);
  if (!parts || (parts.hours === 0 && parts.minutes === 0 && !hasTime(value))) return '';
  return VE_TIME.format(new Date(2000, 0, 1, parts.hours, parts.minutes));
}

/** "sáb 05/12/2026": fecha con el día de la semana abreviado. */
export function formatDisplayDayDate(value: unknown): string {
  const parts = splitDate(value);
  if (!parts) return '';
  const weekday = VE_WEEKDAY.format(new Date(parts.year, parts.month - 1, parts.day)).replace('.', '');
  return `${weekday} ${formatDisplayDate(value)}`;
}

/** 'HH:MM' en 24 h para el backend, a partir de un Date o un string 'HH:MM'. */
export function toTimeOnly(value: unknown): string {
  if (typeof value === 'string') {
    const time = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (time) return `${pad(Number(time[1]))}:${time[2]}`;
  }
  const parts = splitDate(value);
  if (!parts) return '';
  return `${pad(parts.hours)}:${pad(parts.minutes)}`;
}

/** 'YYYY-MM-DDTHH:MM' uniendo un control de fecha y uno de hora. */
export function combineDateTime(date: unknown, time: unknown): string {
  const day = toDateOnly(date);
  if (!day) return '';
  return `${day}T${toTimeOnly(time) || '00:00'}`;
}

/** Date en hora LOCAL del navegador a partir de la fecha guardada. */
export function toLocalDate(value: unknown): Date | null {
  const parts = splitDate(value);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes, parts.seconds);
}

/** Marca de tiempo comparable (sin depender de la zona horaria) para ordenar. */
export function dateTimestamp(value: unknown): number {
  const parts = splitDate(value);
  if (!parts) return Number.MAX_SAFE_INTEGER;
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes, parts.seconds);
}

function hasTime(value: unknown): boolean {
  return /[T ]\d{1,2}:\d{2}/.test(String(value ?? ''));
}
