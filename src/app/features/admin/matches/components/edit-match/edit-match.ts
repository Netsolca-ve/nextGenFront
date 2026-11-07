import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideShirt, LucideSquareStack } from '@lucide/angular';
import { forkJoin, of } from 'rxjs';
import {
  AdminMatch,
  MatchAlignment,
  MatchAlignmentCreate,
  MatchAlignmentUpdate,
  MatchGoal,
  MatchEventType,
  MatchIncident,
  MatchSubstitution,
  MatchUpdateInput,
} from '../../../../../@core/models/match.models';
import { Matches } from '../../../../../@core/services/matches';
import { Teams } from '../../../../../@core/services/teams';
import { TeamPlayer } from '../../../../../@core/models/team.models';
import { Notifications } from '../../../../../@core/services/notifications';
import { getErrorMessage } from '../../../../../@core/utils/http-error';

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    LucideShirt,
    LucideSquareStack,
  ],
  selector: 'app-edit-match',
  templateUrl: './edit-match.html',
  styleUrl: './edit-match.scss',
})
export class EditMatch {
  private readonly dialogRef = inject(MatDialogRef<EditMatch>);
  private readonly matches = inject(Matches);
  private readonly teams = inject(Teams);
  private readonly notifications = inject(Notifications);
  readonly match = inject(MAT_DIALOG_DATA) as AdminMatch;

  readonly alignments = signal<MatchAlignment[]>([]);
  readonly cards = signal<MatchIncident[]>([]);
  readonly goals = signal<MatchGoal[]>([]);
  readonly substitutions = signal<MatchSubstitution[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal(false);
  private initialAlignmentState = '';
  readonly incidentTypes: { value: MatchEventType; label: string }[] = [
    { value: 'yellow', label: 'Tarjeta amarilla' },
    { value: 'red', label: 'Tarjeta roja' },
    { value: 'sub', label: 'Cambio' },
  ];

  readonly form = new FormGroup({
    // Sin marcador real el campo queda vacío (null), nunca en 0: si no, al
    // cambiar solo el estado se guardaría un 0-0 falso en el partido
    marcadorLocal: new FormControl<number | null>(this.match.marcadorLocal ?? null, {
      validators: [Validators.min(0)],
    }),
    marcadorVisitante: new FormControl<number | null>(this.match.marcadorVisitante ?? null, {
      validators: [Validators.min(0)],
    }),
    marcadorPenalesLocal: new FormControl(this.match.marcadorPenalesLocal ?? null),
    marcadorPenalesVisitante: new FormControl(this.match.marcadorPenalesVisitante ?? null),
    status: new FormControl(this.match.status ?? 'programado', { nonNullable: true }),
    fecha: new FormControl(this.dateValue(this.match.fecha), { nonNullable: true }),
  });

  readonly incidentForm = new FormGroup({
    tipo: new FormControl<MatchEventType>('yellow', { nonNullable: true }),
    minuto: new FormControl('', { nonNullable: true }),
    idEquipo: new FormControl<number | null>(this.match.idEquipoLocal, Validators.required),
    idJugador: new FormControl<number | null>(null),
    descripcion: new FormControl('', { nonNullable: true }),
  });

  readonly goalForm = new FormGroup({
    minuto: new FormControl('', { nonNullable: true }),
    idEquipo: new FormControl<number | null>(this.match.idEquipoLocal, Validators.required),
    idJugador: new FormControl<number | null>(null, Validators.required),
    idJugadorAsistencia: new FormControl<number | null>(null),
    esAutogol: new FormControl(false, { nonNullable: true }),
  });

  readonly substitutionForm = new FormGroup({
    minuto: new FormControl('', { nonNullable: true }),
    periodo: new FormControl('1', { nonNullable: true, validators: [Validators.required] }),
    idEquipo: new FormControl<number | null>(this.match.idEquipoLocal, Validators.required),
    idJugadorSale: new FormControl<number | null>(null, Validators.required),
    idJugadorEntra: new FormControl<number | null>(null, Validators.required),
  });

  constructor() {
    const localPlayers = this.match.idEquipoLocal
      ? this.teams.getPlayers(this.match.idEquipoLocal)
      : of<TeamPlayer[]>([]);
    const awayPlayers = this.match.idEquipoVisitante
      ? this.teams.getPlayers(this.match.idEquipoVisitante)
      : of<TeamPlayer[]>([]);

    forkJoin({
      alignments: this.matches.getAlignments(this.match.idPartido),
      goals: this.matches.getGoals(this.match.idPartido),
      substitutions: this.matches.getSubstitutions(this.match.idPartido),
      localPlayers,
      awayPlayers,
    }).subscribe({
      next: ({ alignments, goals, substitutions, localPlayers: home, awayPlayers: away }) => {
        this.alignments.set([
          ...this.mergePlayers(home, this.match.idEquipoLocal ?? 0, alignments),
          ...this.mergePlayers(away, this.match.idEquipoVisitante ?? 0, alignments),
        ]);
        this.initialAlignmentState = this.alignmentState();
        this.goals.set(goals);
        this.substitutions.set(substitutions);
        this.loading.set(false);
      },
      error: (requestError: unknown) => {
        this.loading.set(false);
        this.error.set(true);
        this.notifications.error(getErrorMessage(requestError, 'No se pudieron cargar las alineaciones.'));
      },
    });
  }

  teamName(idEquipo: number): string {
    if (idEquipo === this.match.idEquipoLocal) return this.match.nombreEquipoLocal ?? 'Local';
    if (idEquipo === this.match.idEquipoVisitante) return this.match.nombreEquipoVisitante ?? 'Visitante';
    return 'Equipo';
  }

  playerName(alignment: MatchAlignment): string {
    return alignment.nombreJugador ?? ([alignment.nombre, alignment.apellido].filter(Boolean).join(' ') || `Jugador #${alignment.idJugador}`);
  }

  teamAlignments(idEquipo: number): MatchAlignment[] {
    return this.alignments().filter((alignment) => Number(alignment.idEquipo) === Number(idEquipo));
  }

  toggleConvoked(alignment: MatchAlignment): void {
    const convocado = !this.asBoolean(alignment.convocado);
    this.alignments.update((items) => items.map((item) => item.idJugador === alignment.idJugador
      ? { ...item, convocado, esTitular: convocado && this.asBoolean(item.esTitular), esCapitan: convocado && this.asBoolean(item.esCapitan) }
      : item));
  }

  toggleStarter(alignment: MatchAlignment): void {
    if (!this.asBoolean(alignment.convocado)) return;
    this.alignments.update((items) => items.map((item) => item.idJugador === alignment.idJugador ? { ...item, esTitular: !this.asBoolean(item.esTitular) } : item));
  }

  toggleCaptain(alignment: MatchAlignment): void {
    if (!this.asBoolean(alignment.convocado)) return;
    this.alignments.update((items) => items.map((item) => item.idJugador === alignment.idJugador ? { ...item, esCapitan: !this.asBoolean(item.esCapitan) } : item));
  }

  private parseMinute(value: string | number | null): number | null {
    if (value === null || value === undefined || value === '') return null;
    const minute = Number(value);
    return Number.isFinite(minute) && minute >= 0 ? minute : null;
  }

  addIncident(): void {
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    const incident = this.incidentForm.getRawValue();
    this.cards.update((items) => [
      ...items,
      { ...incident, minuto: this.parseMinute(incident.minuto) } as MatchIncident,
    ]);
    this.incidentForm.reset({ tipo: 'yellow', minuto: '', idEquipo: this.match.idEquipoLocal, idJugador: null, descripcion: '' });
  }

  addGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const goal = this.goalForm.getRawValue();
    this.goals.update((items) => [
      ...items,
      { ...goal, minuto: this.parseMinute(goal.minuto) } as MatchGoal,
    ]);
    this.goalForm.reset({ minuto: '', idEquipo: this.match.idEquipoLocal, idJugador: null, idJugadorAsistencia: null, esAutogol: false });
  }

  addSubstitution(): void {
    if (this.substitutionForm.invalid) {
      this.substitutionForm.markAllAsTouched();
      return;
    }

    const substitution = this.substitutionForm.getRawValue();
    this.substitutions.update((items) => [
      ...items,
      { ...substitution, minuto: this.parseMinute(substitution.minuto) } as MatchSubstitution,
    ]);
    this.substitutionForm.reset({ minuto: '', periodo: '1', idEquipo: this.match.idEquipoLocal, idJugadorSale: null, idJugadorEntra: null });
  }

  removeIncident(type: 'cards' | 'goals' | 'substitutions', index: number): void {
    if (type === 'cards') this.cards.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
    if (type === 'goals') this.goals.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
    if (type === 'substitutions') this.substitutions.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  playerLabel(idJugador: number | null | undefined): string {
    const player = this.alignments().find((item) => item.idJugador === idJugador);
    return player ? this.playerName(player) : 'Seleccionar jugador';
  }

  goalPlayers(): MatchAlignment[] {
    return this.playersForTeam(this.goalForm.controls.idEquipo.value);
  }

  substitutionPlayers(): MatchAlignment[] {
    return this.playersForTeam(this.substitutionForm.controls.idEquipo.value);
  }

  submit(): void {
    if (this.submitting() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(false);
    const values = this.form.getRawValue();
    const payload: MatchUpdateInput = {
      marcadorLocal: values.marcadorLocal ?? null,
      marcadorVisitante: values.marcadorVisitante ?? null,
      marcadorPenalesLocal: values.marcadorPenalesLocal ?? null,
      marcadorPenalesVisitante: values.marcadorPenalesVisitante ?? null,
      status: values.status,
      fecha: values.fecha,
      tarjetas: this.cards(),
    };
    const alignments = this.alignmentPayload();
    const existingAlignments = alignments.filter((alignment) => alignment.idAlineacionPartido > 0);
    const newAlignments: MatchAlignmentCreate[] = alignments
      .filter((alignment) => alignment.idAlineacionPartido === 0)
      .map(({ idAlineacionPartido, ...alignment }) => ({
        ...alignment,
        numeroCamiseta: alignment.numeroCamiseta ?? 0,
      }));

    const newGoals = this.goals().filter((goal) => !goal.idGol).map(({ idGol, idPartido, ...goal }) => this.matches.createGoal(this.match.idPartido, goal));
    const newSubstitutions = this.substitutions().filter((substitution) => !substitution.idSustitucionPartido).map(({ idSustitucionPartido, idPartido, ...substitution }) => this.matches.createSubstitution(this.match.idPartido, substitution));
    const requests = [];

    if (this.form.dirty || this.cards().length > 0) {
      requests.push(this.matches.updateMatch(this.match.idPartido, payload));
    }
    if (this.alignmentState() !== this.initialAlignmentState) {
      if (existingAlignments.length > 0 || this.initialAlignmentState !== '[]') {
        requests.push(this.matches.updateAlignments(this.match.idPartido, existingAlignments));
      }
      if (newAlignments.length > 0) {
        requests.push(...newAlignments.map((alignment) => this.matches.createAlignment(this.match.idPartido, alignment)));
      }
    }
    requests.push(...newGoals, ...newSubstitutions);

    if (requests.length === 0) {
      this.submitting.set(false);
      this.dialogRef.close(false);
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success('Partido actualizado con éxito.');
        this.dialogRef.close(true);
      },
      error: (requestError: unknown) => {
        this.submitting.set(false);
        this.error.set(true);
        this.notifications.error(getErrorMessage(requestError, 'No se pudo actualizar el partido.'));
      },
    });
  }

  private dateValue(value: string): string {
    return value ? value.slice(0, 10) : '';
  }

  private mergePlayers(players: TeamPlayer[], idEquipo: number, current: MatchAlignment[]): MatchAlignment[] {
    return players.map((player) => {
      const alignment = current.find((item) => Number(item.idJugador) === Number(player.idJugador) && Number(item.idEquipo) === Number(idEquipo));
      return alignment
        ? {
            ...alignment,
            idAlineacionPartido: Number(alignment.idAlineacionPartido),
            idPartido: Number(alignment.idPartido),
            idEquipo: Number(alignment.idEquipo),
            idJugador: Number(alignment.idJugador),
            convocado: true,
            esTitular: this.asBoolean(alignment.esTitular),
            esCapitan: this.asBoolean(alignment.esCapitan),
          }
        : {
            idAlineacionPartido: 0,
            esTitular: false,
            esCapitan: false,
            numeroCamiseta: player.numeroCamiseta,
            posicion: player.posicion,
            idPartido: this.match.idPartido,
            idEquipo,
            idJugador: player.idJugador,
            nombre: player.nombre,
            apellido: player.apellido,
            convocado: false,
          };
    });
  }

  private playersForTeam(idEquipo: number | null): MatchAlignment[] {
    return this.teamAlignments(idEquipo ?? 0);
  }

  private asBoolean(value: boolean | number | string | undefined): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  private alignmentPayload(): MatchAlignmentUpdate[] {
    return this.alignments().filter((alignment) => alignment.convocado).map((alignment) => ({
      idAlineacionPartido: alignment.idAlineacionPartido,
      idPartido: this.match.idPartido,
      idEquipo: alignment.idEquipo,
      idJugador: alignment.idJugador,
      esTitular: this.asBoolean(alignment.esTitular),
      esCapitan: this.asBoolean(alignment.esCapitan),
      numeroCamiseta: alignment.numeroCamiseta,
      posicion: alignment.posicion,
    }));
  }

  private alignmentState(): string {
    return JSON.stringify(this.alignmentPayload());
  }
}
