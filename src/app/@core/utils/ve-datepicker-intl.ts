import { Injectable, Provider } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';

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

/**
 * Se provee en AdminLayout y no en app.config.ts: importar el datepicker en la
 * raíz metía todo Angular Material en el bundle inicial del sitio público.
 */
export function provideVeDatepickerIntl(): Provider {
  return { provide: MatDatepickerIntl, useClass: VeDatepickerIntl };
}
