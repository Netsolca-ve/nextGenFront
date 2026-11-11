import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Event } from './event';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { Teams } from '../../../../../@core/services/teams';

describe('Event', () => {
  let component: Event;
  let fixture: ComponentFixture<Event>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Event],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'futsal-cup' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Event);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Event con varias categorías', () => {
  const standings = [
    { idEquipo: 1, nombre: 'Leones', categoria: 'SUB 9', posicion: 1, puntos: 3, partidosJugados: 1, diferenciaGoles: 1 },
    { idEquipo: 2, nombre: 'Tigres', categoria: 'SUB 9', posicion: 2, puntos: 0, partidosJugados: 1, diferenciaGoles: -1 },
    { idEquipo: 5, nombre: 'Halcones', categoria: 'SUB 12', posicion: 1, puntos: 3, partidosJugados: 1, diferenciaGoles: 2 },
    { idEquipo: 6, nombre: 'Águilas', categoria: 'SUB 12', posicion: 2, puntos: 0, partidosJugados: 1, diferenciaGoles: -2 },
  ];
  const matches = [
    { idPartido: 1, fase: 'GRUPO', numeroRonda: 1, categoria: 'SUB 9', idEquipoLocal: 1, idEquipoVisitante: 2, nombreEquipoLocal: 'Leones', nombreEquipoVisitante: 'Tigres', fecha: '2026-12-05 08:30:00', status: 'finalizado' },
    { idPartido: 2, fase: 'GRUPO', numeroRonda: 1, categoria: 'SUB 12', idEquipoLocal: 5, idEquipoVisitante: 6, nombreEquipoLocal: 'Halcones', nombreEquipoVisitante: 'Águilas', fecha: '2026-12-05 09:15:00', status: 'finalizado' },
    { idPartido: 3, fase: 'FINAL', numeroRonda: 3, categoria: 'SUB 12', idEquipoLocal: null, idEquipoVisitante: null, fecha: '2026-12-13 10:00:00', status: 'programado' },
  ];

  const scorers = [
    { idJugador: 10, nombre: 'Ana', apellido: 'Pérez', idEquipo: 1, nombreEquipo: 'Leones', categoria: 'SUB 9', goles: 3 },
    { idJugador: 11, nombre: 'Luis', apellido: 'Gómez', idEquipo: 2, nombreEquipo: 'Tigres', categoria: 'SUB 9', goles: 3 },
    { idJugador: 12, nombre: 'Juan', apellido: 'Díaz', idEquipo: 5, nombreEquipo: 'Halcones', categoria: 'SUB 12', goles: 1 },
  ];

  async function render() {
    await TestBed.configureTestingModule({
      imports: [Event],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '11' })) } },
        {
          provide: Tournaments,
          useValue: {
            getAllTournaments: vi.fn(() =>
              of([{ idTorneo: 11, nombre: 'Copa', categoria: 'SUB 9, SUB 12', formato_config: { categoriasHabilitadas: ['SUB 9', 'SUB 12'] } }]),
            ),
            getTournamentMatches: vi.fn(() => of(matches)),
            getTournamentStandings: vi.fn(() => of(standings)),
            getTournamentScorers: vi.fn(() => of(scorers)),
          },
        },
        { provide: Teams, useValue: { getAllTeams: vi.fn(() => of([])) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Event);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const texts = (root: HTMLElement, selector: string) =>
    [...root.querySelectorAll(selector)].map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');

  it('muestra un botón por categoría y cambia la tabla y los partidos al elegir otra', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    const chips = [...el.querySelectorAll<HTMLButtonElement>('.eventCategoryChip')];
    expect(chips.map((chip) => chip.querySelector('strong')?.textContent)).toEqual(['SUB 9', 'SUB 12']);
    expect(texts(el, '.publicStandingRow').join(' ')).toContain('Leones');
    expect(texts(el, '.publicStandingRow').join(' ')).not.toContain('Halcones');

    // Goleadores de SUB 9: empatados en goles comparten el puesto 1
    expect(texts(el, '.publicScorerRow')).toEqual([
      '1Ana PérezLeones3 goles',
      '1Luis GómezTigres3 goles',
    ]);

    chips[1].click();
    fixture.detectChanges();

    expect(texts(el, '.publicScorerRow')).toEqual(['1Juan DíazHalcones1 gol']);

    const tabla = texts(el, '.publicStandingRow').join(' ');
    expect(tabla).toContain('Halcones');
    expect(tabla).not.toContain('Leones');
    const partidos = texts(el, '.publicMatchRow').join(' ');
    expect(partidos).toContain('Halcones');
    // La final sin equipos se muestra como "Por definir"
    expect(partidos).toContain('Final');
    expect(partidos).toContain('Por definir');
  });
});
