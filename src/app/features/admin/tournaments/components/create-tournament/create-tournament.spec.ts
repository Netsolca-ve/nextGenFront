import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CreateTournament } from './create-tournament';
import { TournamentInput } from '../../../../../@core/models/tournament.models';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { Teams } from '../../../../../@core/services/teams';
import { ImageUpload } from '../../../../../@core/services/image-upload';
import { Notifications } from '../../../../../@core/services/notifications';

describe('CreateTournament', () => {
  let component: CreateTournament;
  let fixture: ComponentFixture<CreateTournament>;

  const createTournament = vi.fn((payload: TournamentInput) => of({ payload }));
  const updateTournament = vi.fn((payload: TournamentInput) => of({ payload }));
  const close = vi.fn();

  beforeEach(async () => {
    createTournament.mockClear();
    updateTournament.mockClear();
    close.mockClear();

    await TestBed.configureTestingModule({
      imports: [CreateTournament],
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: Tournaments, useValue: { createTournament, updateTournament } },
        { provide: Teams, useValue: { getAllTeams: vi.fn(() => of([])) } },
        { provide: ImageUpload, useValue: { upload: vi.fn(() => of({})) } },
        { provide: Notifications, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTournament);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('guarda sin sede ni fecha cuando el estado es Próximamente', () => {
    component.form.patchValue({
      name: 'Copa de prueba',
      status: 'PROXIMAMENTE',
      place: '',
      startDate: '',
    });
    component.selectedTeams.set([1, 2, 3, 4]);

    component.submit();

    expect(createTournament).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith(true);
    const payload = createTournament.mock.calls[0][0];
    expect(payload.fechaInicio).toBeNull();
  });

  it('sigue exigiendo sede y fecha en los demás estados', () => {
    component.form.patchValue({ name: 'Copa de prueba', status: 'PROGRAMADO', place: '', startDate: '' });
    expect(component.form.invalid).toBe(true);

    component.submit();
    expect(createTournament).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('marca la sede y la fecha como opcionales al elegir Próximamente', () => {
    component.form.patchValue({ name: 'Copa de prueba', status: 'PROXIMAMENTE' });

    expect(component.esProximamente()).toBe(true);
    expect(component.form.controls.place.valid).toBe(true);
    expect(component.form.controls.startDate.valid).toBe(true);
    expect(component.form.invalid).toBe(false);
  });

  it('explica junto al botón por qué no se pudo guardar', () => {
    component.form.patchValue({ name: 'Copa de prueba', status: 'PROXIMAMENTE', place: '', startDate: '' });
    component.selectedTeams.set([1, 2]); // faltan equipos

    component.submit();

    expect(createTournament).not.toHaveBeenCalled();
    expect(component.formError()).toContain('Selecciona exactamente 4 equipos');
  });

  it('muestra el mensaje del servidor junto al botón cuando falla el guardado', () => {
    createTournament.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Faltan datos obligatorios' } })),
    );
    component.form.patchValue({ name: 'Copa de prueba', status: 'PROXIMAMENTE', place: '', startDate: '' });
    component.selectedTeams.set([1, 2, 3, 4]);

    component.submit();

    expect(component.formError()).toContain('Faltan datos obligatorios');
    expect(close).not.toHaveBeenCalled();
  });
});
