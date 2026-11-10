import { registerLocaleData } from '@angular/common';
import localeEsVE from '@angular/common/locales/es-VE';
import { Injectable, LOCALE_ID, Provider } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { splitDate } from './datetime';

/** Locale de la app: fechas dd/mm/aaaa y horas en 12 h ("8:30 a. m."). */
export const VE_LOCALE = 'es-VE';

registerLocaleData(localeEsVE, VE_LOCALE);

/** Formatos de los datepickers y timepickers de Angular Material. */
export const VE_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: null, timeInput: null },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    timeInput: { hour: 'numeric', minute: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
    timeOptionLabel: { hour: 'numeric', minute: '2-digit' },
  },
};

/**
 * NativeDateAdapter con dos ajustes para Venezuela:
 * - Lo escrito a mano se lee como dd/mm/aaaa (el nativo usa Date.parse,
 *   que lo interpreta como mm/dd/aaaa).
 * - Los strings del backend ('YYYY-MM-DD', 'YYYY-MM-DD HH:MM:SS', 'HH:MM') se
 *   leen como hora local: el nativo los pasa a UTC y la fecha retrocede un día.
 */
@Injectable()
export class VeDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value, parseFormat);
    }

    const text = value.trim();
    if (!text) return null;

    const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})$/);
    if (!dmy) return this.invalid();

    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    const month = Number(dmy[2]) - 1;
    const day = Number(dmy[1]);
    const date = new Date(year, month, day);

    // Rechaza fechas imposibles como 31/02 en vez de pasarlas al mes siguiente
    return date.getMonth() === month && date.getDate() === day ? date : this.invalid();
  }

  override deserialize(value: unknown): Date | null {
    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return null;

      const time = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (time) {
        return this.setTime(this.today(), Number(time[1]), Number(time[2]), Number(time[3] ?? 0));
      }

      const parts = /^\d{4}-\d{2}-\d{2}/.test(text) ? splitDate(text) : null;
      if (parts) {
        return new Date(
          parts.year,
          parts.month - 1,
          parts.day,
          parts.hours,
          parts.minutes,
          parts.seconds,
        );
      }
    }

    return super.deserialize(value);
  }
}

/** Textos del calendario en español (botones y lectores de pantalla). */
@Injectable()
export class VeDatepickerIntl extends MatDatepickerIntl {
  override calendarLabel = 'Calendario';
  override openCalendarLabel = 'Abrir calendario';
  override closeCalendarLabel = 'Cerrar calendario';
  override prevMonthLabel = 'Mes anterior';
  override nextMonthLabel = 'Mes siguiente';
  override prevYearLabel = 'Año anterior';
  override nextYearLabel = 'Año siguiente';
  override prevMultiYearLabel = '24 años anteriores';
  override nextMultiYearLabel = '24 años siguientes';
  override switchToMonthViewLabel = 'Elegir fecha';
  override switchToMultiYearViewLabel = 'Elegir mes y año';
  override startDateLabel = 'Fecha de inicio';
  override endDateLabel = 'Fecha de cierre';
  override comparisonDateLabel = 'Rango de comparación';
}

/** Locale, adaptador y formatos de fecha de la app (app.config.ts). */
export function provideVenezuelaDates(): Provider[] {
  return [
    { provide: LOCALE_ID, useValue: VE_LOCALE },
    { provide: MAT_DATE_LOCALE, useValue: VE_LOCALE },
    { provide: DateAdapter, useClass: VeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: VE_DATE_FORMATS },
    { provide: MatDatepickerIntl, useClass: VeDatepickerIntl },
  ];
}
