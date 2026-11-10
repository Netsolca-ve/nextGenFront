import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { combineDateTime, formatDisplayDayDate, formatDisplayTime, toTimeOnly } from './datetime';
import { provideVenezuelaDates } from './ve-date-adapter';

describe('Fechas en formato de Venezuela', () => {
  let adapter: DateAdapter<Date>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideVenezuelaDates() });
    adapter = TestBed.inject(DateAdapter<Date>);
  });

  it('lee lo escrito a mano como dd/mm/aaaa', () => {
    const date = adapter.parse('05/12/2026', null)!;
    expect([date.getDate(), date.getMonth() + 1, date.getFullYear()]).toEqual([5, 12, 2026]);
  });

  it('rechaza fechas imposibles', () => {
    expect(adapter.isValid(adapter.parse('31/02/2026', null)!)).toBe(false);
  });

  it('muestra la fecha como dd/mm/aaaa', () => {
    expect(adapter.format(new Date(2026, 11, 5), { day: '2-digit', month: '2-digit', year: 'numeric' }))
      .toBe('05/12/2026');
  });

  it('carga los strings del backend como hora local, sin correr el día', () => {
    const day = adapter.deserialize('2026-12-05')!;
    expect([day.getDate(), day.getHours()]).toEqual([5, 0]);

    const time = adapter.deserialize('14:30')!;
    expect([time.getHours(), time.getMinutes()]).toEqual([14, 30]);
  });

  it('muestra la hora en 12 h y la envía al backend en 24 h', () => {
    expect(formatDisplayTime('2026-12-05 08:30:00')).toMatch(/^8:30\sa\.\s?m\.$/);
    expect(formatDisplayTime('2026-12-05 15:10:00')).toMatch(/^3:10\sp\.\s?m\.$/);
    expect(toTimeOnly(new Date(2026, 11, 5, 15, 10))).toBe('15:10');
    expect(toTimeOnly('8:05')).toBe('08:05');
  });

  it('une fecha y hora para el partido', () => {
    expect(combineDateTime(new Date(2026, 11, 5), new Date(2000, 0, 1, 9, 10))).toBe('2026-12-05T09:10');
    expect(combineDateTime('2026-12-05', '')).toBe('2026-12-05T00:00');
  });

  it('muestra el día de la semana en los días de juego', () => {
    expect(formatDisplayDayDate('2026-12-05')).toBe('sáb 05/12/2026');
  });
});
