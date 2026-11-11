import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Home } from './home';
import { Tournaments } from '../../../@core/services/tournaments';
import { Teams } from '../../../@core/services/teams';

/** Servicios simulados: los tests no llaman a la API real. */
function mockServices(nearest: unknown) {
  return [
    {
      provide: Tournaments,
      useValue: {
        getNearestTournament: vi.fn(() => of(nearest)),
        getTournamentMatches: vi.fn(() => of([])),
        getTournamentStandings: vi.fn(() => of([])),
      },
    },
    { provide: Teams, useValue: { getAllTeams: vi.fn(() => of([])) } },
  ];
}

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), ...mockServices(null)],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar los 4 iconos lucide con size 48 y color', () => {
    const el = fixture.nativeElement as HTMLElement;
    const icons = el.querySelectorAll(
      'svg[lucideVolleyball], svg[lucideTrendingUp], svg[lucideShieldHalf], svg[lucideGraduationCap]'
    );
    expect(icons.length).toBe(4);
    for (const svg of icons) {
      expect(svg.outerHTML).toMatch(/width="48"/);
      expect(svg.outerHTML).toMatch(/(stroke|color)="#0094DD"/);
    }
  });

  it('muestra el nombre del torneo encima de "PRIMER PARTIDO" y "PRÓXIMO PARTIDO"', () => {
    component.tournamentName.set('Copa NextGen 2026');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const nombres = Array.from(el.querySelectorAll('.cardTournamentName')).map(
      (node) => node.textContent?.trim(),
    );
    // Las tres tarjetas (tabla, primer partido y próximo partido)
    expect(nombres).toHaveLength(3);
    expect(nombres.every((texto) => texto === 'Copa NextGen 2026')).toBe(true);
  });

  it('no pinta el nombre del torneo si todavía no hay datos', () => {
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.cardTournamentName').length).toBe(0);
  });
});

describe('Home: estado del torneo destacado', () => {
  async function render(nearest: unknown) {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), ...mockServices(nearest)],
    }).compileComponents();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const torneo = (estadoCalendario: string, fechaInicio: string, fechaFin: string) => ({
    idTorneo: 1,
    nombre: 'Futsal Cup 2026',
    estadoCalendario,
    fechaInicio,
    fechaFin,
    formato_config: { horaInicioJornada: '08:30' },
  });

  it('muestra el contador si el torneo es próximo', async () => {
    const el = await render(torneo('PROXIMO', '2099-01-10', '2099-01-12'));
    expect(el.querySelector('.matchInfo > span')?.textContent).toBe('PRÓXIMO EVENTO');
    expect(el.querySelector('.countdown')).not.toBeNull();
    expect(el.querySelector('.eventStatus')).toBeNull();
  });

  it('muestra "en curso" con las fechas mientras se juega', async () => {
    const el = await render(torneo('EN_CURSO', '2026-11-07', '2026-11-15'));
    expect(el.querySelector('.matchInfo > span')?.textContent).toBe('EVENTO EN CURSO');
    expect(el.querySelector('.countdown')).toBeNull();
    expect(el.querySelector('.eventStatus.is-live')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'EN CURSO07/11/2026 – 15/11/2026',
    );
  });

  it('muestra "finalizado" si terminó y no hay otro torneo', async () => {
    const el = await render(torneo('FINALIZADO', '2026-10-01', '2026-10-05'));
    expect(el.querySelector('.matchInfo > span')?.textContent).toBe('EVENTO FINALIZADO');
    expect(el.querySelector('.eventStatus:not(.is-live) strong')?.textContent).toBe('FINALIZADO');
  });
});
