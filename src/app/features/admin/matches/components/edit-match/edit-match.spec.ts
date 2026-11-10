import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EditMatch } from './edit-match';
import { AdminMatch, MatchGoal, MatchUpdateInput } from '../../../../../@core/models/match.models';
import { Matches } from '../../../../../@core/services/matches';
import { Teams } from '../../../../../@core/services/teams';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { Notifications } from '../../../../../@core/services/notifications';
import { provideVenezuelaDates } from '../../../../../@core/utils/ve-date-adapter';

describe('EditMatch', () => {
  let component: EditMatch;
  let fixture: ComponentFixture<EditMatch>;

  const MATCH: AdminMatch = {
    idPartido: 10,
    idTorneo: 5,
    fase: 'GRUPO',
    numeroRonda: 1,
    marcadorLocal: null,
    marcadorVisitante: null,
    marcadorPenalesLocal: null,
    marcadorPenalesVisitante: null,
    duracionTiempoMinutos: 20,
    duracionDescansoMinutos: 5,
    tieneTiempoExtra: null,
    duracionExtraMinutos: null,
    tieneTandaPenales: null,
    status: 'programado',
    ganador: null,
    fecha: '2026-11-14 08:30:00',
    direccion: null,
    idEquipoLocal: 1,
    idEquipoVisitante: 2,
    nombreEquipoLocal: 'Tigres',
    nombreEquipoVisitante: 'Leones',
  };

  const updateMatch = vi.fn((_id: number, _payload: unknown) => of({ message: 'ok' }));
  const updateAlignments = vi.fn(() => of({ message: 'ok' }));
  const createAlignment = vi.fn(() => of({ message: 'ok' }));
  const createGoal = vi.fn(() => of({ message: 'ok' }));
  const createSubstitution = vi.fn(() => of({ message: 'ok' }));
  const getPlayers = vi.fn(() => of([]));
  const getGoals = vi.fn(() => of<MatchGoal[]>([]));
  const close = vi.fn();

  beforeEach(async () => {
    updateMatch.mockClear();
    close.mockClear();
    getGoals.mockReturnValue(of<MatchGoal[]>([]));

    await TestBed.configureTestingModule({
      imports: [EditMatch],
      providers: [
        ...provideVenezuelaDates(),
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: MATCH },
        {
          provide: Matches,
          useValue: {
            getAlignments: vi.fn(() => of([])),
            getGoals,
            getSubstitutions: vi.fn(() => of([])),
            getCards: vi.fn(() => of([])),
            updateMatch,
            updateAlignments,
            createAlignment,
            createGoal,
            createSubstitution,
          },
        },
        { provide: Teams, useValue: { getPlayers, getAllTeams: vi.fn(() => of([])) } },
        {
          provide: Tournaments,
          useValue: {
            getTournamentTeams: vi.fn(() =>
              of([
                { idEquipo: 1, nombre: 'Tigres' },
                { idEquipo: 2, nombre: 'Leones' },
                { idEquipo: 3, nombre: 'Cóndores' },
              ]),
            ),
          },
        },
        { provide: Notifications, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMatch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse con los dos equipos originales', () => {
    expect(component).toBeTruthy();
    expect(component.localId()).toBe(1);
    expect(component.visitanteId()).toBe(2);
    expect(component.teamOptions().map((team) => team.id)).toEqual([1, 2, 3]);
  });

  it('envía solo el equipo que cambió', () => {
    component.form.controls.idEquipoLocal.setValue(3);
    component.form.markAsDirty(); // en la UI lo hace el value accessor
    component.submit();

    expect(updateMatch).toHaveBeenCalledTimes(1);
    const payload = updateMatch.mock.calls[0][1] as MatchUpdateInput;
    expect(payload.idEquipoLocal).toBe(3);
    expect(payload.idEquipoVisitante).toBeUndefined();
    expect(close).toHaveBeenCalledWith(true);
  });

  it('no envía equipos cuando siguen siendo los originales', () => {
    component.form.controls.status.setValue('en_vivo');
    component.form.markAsDirty(); // en la UI lo hace el value accessor
    component.submit();

    expect(updateMatch).toHaveBeenCalledTimes(1);
    const payload = updateMatch.mock.calls[0][1] as MatchUpdateInput;
    expect(payload.idEquipoLocal).toBeUndefined();
    expect(payload.idEquipoVisitante).toBeUndefined();
  });

  it('no guarda si el mismo equipo quedó en los dos lados', () => {
    component.form.controls.idEquipoLocal.setValue(2);
    component.submit();

    expect(component.equiposRepetidos()).toBe(true);
    expect(component.teamError()).toBe(true);
    expect(updateMatch).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('oculta los registros del equipo reemplazado', () => {
    getGoals.mockReturnValue(
      of<MatchGoal[]>([
        { idGol: 1, idPartido: 10, minuto: 5, idEquipo: 1, idJugador: 7, esAutogol: false } as MatchGoal,
      ]),
    );

    const otroFixture = TestBed.createComponent(EditMatch);
    const otroComponent = otroFixture.componentInstance;
    otroFixture.detectChanges();

    expect(otroComponent.goals()).toHaveLength(1);
    otroComponent.form.controls.idEquipoLocal.setValue(3);
    expect(otroComponent.goals()).toHaveLength(0);
    expect(otroComponent.teamName(3)).toBe('Cóndores');
  });
});
