import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { LucideShirt, LucideSquareStack } from '@lucide/angular';
import { forkJoin, of } from 'rxjs';
import {
  AdminMatch,
  MatchAlignment,
  MatchAlignmentUpdate,
  MatchGoal,
  MatchEventType,
  MatchIncident,
  MatchSubstitution,
  MatchUpdateInput,
} from '../../../../../@core/models/match.models';
import { Matches } from '../../../../../@core/services/matches';
import { Teams } from '../../../../../@core/services/teams';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { AdminTeam, positionLabel, TeamPlayer } from '../../../../../@core/models/team.models';
import { Notifications } from '../../../../../@core/services/notifications';
import { getErrorMessage } from '../../../../../@core/utils/http-error';
import {
  combineDateTime,
  DateValue,
  toDateOnly,
  toTimeOnly,
} from '../../../../../@core/utils/datetime';

/** Opción del selector de equipos (reemplazo a última hora). */
interface TeamOption {
  id: number;
  nombre: string;
}

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTimepickerModule,
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
  private readonly tournaments = inject(Tournaments);
  private readonly notifications = inject(Notifications);
  readonly match = inject(MAT_DIALOG_DATA) as AdminMatch;
  readonly positionLabel = positionLabel;

  readonly alignments = signal<MatchAlignment[]>([]);
  readonly cards = signal<MatchIncident[]>([]);
  readonly goals = signal<MatchGoal[]>([]);
  readonly substitutions = signal<MatchSubstitution[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal(false);
  /** Equipos elegibles para reemplazar a uno de los dos lados del partido. */
  readonly teamOptions = signal<TeamOption[]>([]);
  /** true cuando el mismo equipo quedó en los dos lados. */
  readonly teamError = signal(false);
  private initialAlignmentState = '';
  /** Alineaciones guardadas en el servidor (para reusar sus IDs al cambiar de equipo). */
  private serverAlignments: MatchAlignment[] = [];
  private lastLocalId = Number(this.match.idEquipoLocal ?? 0);
  private lastVisitanteId = Number(this.match.idEquipoVisitante ?? 0);
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
    // Fecha y hora en controles separados: el datepicker pone la hora en 00:00
    // al elegir un día, así que se unen al guardar (sin perder la hora)
    fechaDia: new FormControl<DateValue>(toDateOnly(this.match.fecha), { nonNullable: true }),
    fechaHora: new FormControl<DateValue>(toTimeOnly(this.match.fecha), { nonNullable: true }),
    // Reemplazo de equipos a última hora: se envían solo si cambiaron
    idEquipoLocal: new FormControl<number | null>(this.match.idEquipoLocal ?? null, {
      validators: [Validators.required],
    }),
    idEquipoVisitante: new FormControl<number | null>(this.match.idEquipoVisitante ?? null, {
      validators: [Validators.required],
    }),
  });

  readonly incidentForm = new FormGroup({
    tipo: new FormControl<MatchEventType>('yellow', { nonNullable: true }),
    minuto: new FormControl('', { nonNullable: true }),
    idEquipo: new FormControl<number | null>(this.match.idEquipoLocal, Validators.required),
    // La tabla de tarjetas exige el jugador amonestado
    idJugador: new FormControl<number | null>(null, Validators.required),
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
      cards: this.matches.getCards(this.match.idPartido),
      localPlayers,
      awayPlayers,
    }).subscribe({
      next: ({ alignments, goals, substitutions, cards, localPlayers: home, awayPlayers: away }) => {
        this.serverAlignments = alignments;
        this.alignments.set([
          ...this.mergePlayers(home, this.match.idEquipoLocal ?? 0, alignments),
          ...this.mergePlayers(away, this.match.idEquipoVisitante ?? 0, alignments),
        ]);
        this.initialAlignmentState = this.alignmentState();
        this.goals.set(goals);
        this.substitutions.set(substitutions);
        this.cards.set(cards);
        this.loading.set(false);
      },
      error: (requestError: unknown) => {
        this.loading.set(false);
        this.error.set(true);
        this.notifications.error(getErrorMessage(requestError, 'No se pudieron cargar las alineaciones.'));
      },
    });

    // Equipos candidatos para el reemplazo (inscritos del torneo; si no hay
    // inscripciones, todos los registrados).
    this.loadTeamOptions();

    this.form.controls.idEquipoLocal.valueChanges.subscribe((value) =>
      this.onTeamSideChange('local', Number(value ?? 0)),
    );
    this.form.controls.idEquipoVisitante.valueChanges.subscribe((value) =>
      this.onTeamSideChange('visitante', Number(value ?? 0)),
    );
  }

  /** ID del equipo local elegido en el formulario. */
  localId(): number {
    return Number(this.form.controls.idEquipoLocal.value ?? 0);
  }

  /** ID del equipo visitante elegido en el formulario. */
  visitanteId(): number {
    return Number(this.form.controls.idEquipoVisitante.value ?? 0);
  }

  localName(): string {
    return this.teamName(this.localId());
  }

  visitanteName(): string {
    return this.teamName(this.visitanteId());
  }

  /** El mismo equipo no puede jugar en los dos lados del partido. */
  equiposRepetidos(): boolean {
    const local = this.localId();
    return local > 0 && local === this.visitanteId();
  }

  /** true si el formulario apunta a otros equipos que los del partido original. */
  cambioEquipo(): boolean {
    return (
      this.localId() !== Number(this.match.idEquipoLocal ?? 0) ||
      this.visitanteId() !== Number(this.match.idEquipoVisitante ?? 0)
    );
  }

  teamName(idEquipo: number | null | undefined): string {
    const id = Number(idEquipo ?? 0);
    const option = this.teamOptions().find((team) => team.id === id);
    if (option) return option.nombre;
    if (id === Number(this.match.idEquipoLocal ?? 0)) return this.match.nombreEquipoLocal ?? 'Local';
    if (id === Number(this.match.idEquipoVisitante ?? 0)) return this.match.nombreEquipoVisitante ?? 'Visitante';
    return id > 0 ? `Equipo ${id}` : 'Local';
  }

  /** Opciones de equipo: los inscritos en el torneo (o todos si no hay lista). */
  private loadTeamOptions(): void {
    const idTorneo = Number(this.match.idTorneo ?? 0);

    forkJoin({
      inscritos:
        idTorneo > 0
          ? this.tournaments.getTournamentTeams(idTorneo)
          : of<Array<{ idEquipo: number; nombre?: string }>>([]),
      todas: this.teams.getAllTeams(),
    }).subscribe({
      next: ({ inscritos, todas }) => {
        const todasLista: AdminTeam[] = Array.isArray(todas) ? todas : (todas.data ?? []);
        const nombreDe = (id: number): string | undefined => {
          const equipo = todasLista.find((item) => Number(item.idEquipo ?? item.id) === id);
          return equipo?.nombre || equipo?.name || undefined;
        };

        const opciones: TeamOption[] = [];
        const agregar = (id: number, nombre?: string): void => {
          const equipoId = Number(id);
          if (!Number.isFinite(equipoId) || equipoId <= 0) return;
          if (opciones.some((option) => option.id === equipoId)) return;
          opciones.push({ id: equipoId, nombre: nombre || nombreDe(equipoId) || `Equipo ${equipoId}` });
        };

        const inscritosIds = inscritos
          .map((equipo) => Number(equipo.idEquipo))
          .filter((id) => Number.isFinite(id) && id > 0);
        const fuente = inscritosIds.length
          ? inscritosIds
          : todasLista.map((equipo) => Number(equipo.idEquipo ?? equipo.id));

        for (const id of fuente) {
          agregar(id, inscritos.find((equipo) => Number(equipo.idEquipo) === id)?.nombre);
        }

        // Los dos equipos del partido siempre figuran, aunque no estén inscritos
        agregar(Number(this.match.idEquipoLocal ?? 0), this.match.nombreEquipoLocal);
        agregar(Number(this.match.idEquipoVisitante ?? 0), this.match.nombreEquipoVisitante);

        this.teamOptions.set(opciones);
      },
      error: () => {
        // Sin lista del servidor: al menos los dos equipos actuales del partido
        this.teamOptions.set(
          [
            { id: Number(this.match.idEquipoLocal ?? 0), nombre: this.match.nombreEquipoLocal ?? 'Local' },
            {
              id: Number(this.match.idEquipoVisitante ?? 0),
              nombre: this.match.nombreEquipoVisitante ?? 'Visitante',
            },
          ].filter((option) => option.id > 0),
        );
      },
    });
  }

  /**
   * Cambió un lado del fixture: se ocultan los registros del equipo
   * reemplazado (el backend los borra al guardar) y se carga la plantilla
   * del equipo nuevo para poder convocarlo.
   */
  private onTeamSideChange(side: 'local' | 'visitante', nuevoId: number): void {
    const viejoId = side === 'local' ? this.lastLocalId : this.lastVisitanteId;
    if (side === 'local') this.lastLocalId = nuevoId;
    else this.lastVisitanteId = nuevoId;

    this.teamError.set(false);

    if (!Number.isFinite(nuevoId) || nuevoId <= 0 || nuevoId === viejoId) return;

    const otroId = side === 'local' ? this.visitanteId() : this.localId();
    // Equipo repetido en los dos lados: se avisa y no se toca nada todavía
    if (nuevoId === otroId) return;

    const sigueJugando = this.localId() === viejoId || this.visitanteId() === viejoId;

    if (viejoId > 0 && !sigueJugando) {
      this.alignments.update((items) => items.filter((item) => Number(item.idEquipo) !== viejoId));
      this.goals.update((items) => items.filter((item) => Number(item.idEquipo) !== viejoId));
      this.substitutions.update((items) => items.filter((item) => Number(item.idEquipo) !== viejoId));
      this.cards.update((items) => items.filter((item) => Number(item.idEquipo) !== viejoId));

      for (const control of [
        this.incidentForm.controls.idEquipo,
        this.goalForm.controls.idEquipo,
        this.substitutionForm.controls.idEquipo,
      ]) {
        if (Number(control.value ?? 0) === viejoId) control.setValue(nuevoId);
      }
    }

    this.teams.getPlayers(nuevoId).subscribe({
      next: (players) => {
        this.alignments.update((items) => [
          ...items.filter((item) => Number(item.idEquipo) !== nuevoId),
          ...this.mergePlayers(players ?? [], nuevoId, this.serverAlignments),
        ]);
      },
      error: (requestError: unknown) => {
        this.notifications.error(getErrorMessage(requestError, 'No se pudo cargar la plantilla del equipo.'));
      },
    });
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
    this.incidentForm.reset({ tipo: 'yellow', minuto: '', idEquipo: this.localId(), idJugador: null, descripcion: '' });
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
    this.goalForm.reset({ minuto: '', idEquipo: this.localId(), idJugador: null, idJugadorAsistencia: null, esAutogol: false });
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
    this.substitutionForm.reset({ minuto: '', periodo: '1', idEquipo: this.localId(), idJugadorSale: null, idJugadorEntra: null });
  }

  removeIncident(type: 'cards' | 'goals' | 'substitutions', index: number): void {
    if (type === 'cards') this.cards.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
    if (type === 'goals') this.goals.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
    if (type === 'substitutions') this.substitutions.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  /** Tarjetas agregadas en este diálogo y aún no guardadas. */
  private newCards(): MatchIncident[] {
    return this.cards().filter((card) => !card.id && !card.idTarjeta);
  }

  isAutoGoal(goal: MatchGoal): boolean {
    return this.asBoolean(goal.esAutogol);
  }

  /** Equipo al que suma el gol (en un autogol, el rival del jugador). */
  goalBeneficiary(goal: MatchGoal): string {
    if (!this.isAutoGoal(goal)) return this.teamName(Number(goal.idEquipo));
    const rival = Number(goal.idEquipo) === this.localId() ? this.visitanteId() : this.localId();
    return this.teamName(rival);
  }

  playerLabel(idJugador: number | null | undefined): string {
    const player = this.alignments().find((item) => Number(item.idJugador) === Number(idJugador));
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

    const local = this.localId();
    const visitante = this.visitanteId();

    if (!local || !visitante || local === visitante) {
      this.teamError.set(true);
      return;
    }

    this.submitting.set(true);
    this.error.set(false);
    this.teamError.set(false);
    const values = this.form.getRawValue();
    const payload: MatchUpdateInput = {
      marcadorLocal: values.marcadorLocal ?? null,
      marcadorVisitante: values.marcadorVisitante ?? null,
      marcadorPenalesLocal: values.marcadorPenalesLocal ?? null,
      marcadorPenalesVisitante: values.marcadorPenalesVisitante ?? null,
      status: values.status,
      fecha: combineDateTime(values.fechaDia, values.fechaHora),
    };

    // Solo se envían los equipos si cambiaron: el backend además limpia los
    // registros (alineaciones, goles y cambios) del equipo reemplazado.
    if (local !== Number(this.match.idEquipoLocal ?? 0)) payload.idEquipoLocal = local;
    if (visitante !== Number(this.match.idEquipoVisitante ?? 0)) payload.idEquipoVisitante = visitante;
    // Alineaciones, goles, cambios y tarjetas nuevos van en la misma petición:
    // el backend los guarda junto con el resultado en una transacción, así
    // nunca queda el partido guardado a medias.
    if (this.alignmentState() !== this.initialAlignmentState) {
      const alignments = this.alignmentPayload();
      payload.alineaciones = alignments
        .filter((alignment) => alignment.idAlineacionPartido > 0)
        .map((alignment) => ({
          idAlineacionPartido: alignment.idAlineacionPartido,
          esTitular: alignment.esTitular,
          esCapitan: alignment.esCapitan,
          numeroCamiseta: alignment.numeroCamiseta ?? 0,
          posicion: alignment.posicion ?? null,
        }));
      payload.nuevasAlineaciones = alignments
        .filter((alignment) => alignment.idAlineacionPartido === 0)
        .map((alignment) => ({
          idEquipo: Number(alignment.idEquipo),
          idJugador: Number(alignment.idJugador),
          esTitular: alignment.esTitular,
          esCapitan: alignment.esCapitan,
          numeroCamiseta: alignment.numeroCamiseta ?? 0,
          posicion: alignment.posicion ?? null,
        }));
    }
    payload.goles = this.goals()
      .filter((goal) => !goal.idGol)
      .map((goal) => ({
        minuto: this.parseMinute(goal.minuto),
        esAutogol: this.asBoolean(goal.esAutogol),
        idEquipo: Number(goal.idEquipo),
        idJugador: Number(goal.idJugador),
        idJugadorAsistencia: goal.idJugadorAsistencia ? Number(goal.idJugadorAsistencia) : null,
      }));
    payload.sustituciones = this.substitutions()
      .filter((substitution) => !substitution.idSustitucionPartido)
      .map((substitution) => ({
        minuto: this.parseMinute(substitution.minuto),
        periodo: Number(substitution.periodo) || 1,
        idEquipo: Number(substitution.idEquipo),
        idJugadorSale: Number(substitution.idJugadorSale),
        idJugadorEntra: Number(substitution.idJugadorEntra),
      }));
    payload.tarjetas = this.newCards().map((card) => ({
      tipo: String(card.tipo),
      minuto: this.parseMinute(card.minuto),
      idEquipo: Number(card.idEquipo),
      idJugador: Number(card.idJugador),
      descripcion: card.descripcion?.trim() || null,
    }));

    const hayRegistros =
      Boolean(payload.alineaciones?.length || payload.nuevasAlineaciones?.length) ||
      payload.goles.length > 0 ||
      payload.sustituciones.length > 0 ||
      payload.tarjetas.length > 0;

    if (!this.form.dirty && !hayRegistros) {
      this.submitting.set(false);
      this.dialogRef.close(false);
      return;
    }

    this.matches.updateMatch(this.match.idPartido, payload).subscribe({
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

  playersForTeam(idEquipo: number | null): MatchAlignment[] {
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
