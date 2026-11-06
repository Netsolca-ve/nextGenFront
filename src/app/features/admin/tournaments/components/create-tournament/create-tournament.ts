import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideImagePlus, LucideTrophy } from '@lucide/angular';
import { forkJoin, of } from 'rxjs';
import {
  CRITERIOS_DESEMPATE,
  AdminTournament,
  CruceConfig,
  DEFINICIONES_EMPATE,
  isProximamente,
  TORNEO_ESTATOS,
  TORNEO_TIPOS,
  TournamentInput,
  createDefaultFormatoConfig,
  parseFormatoConfig,
  toDateInput,
} from '../../../../../@core/models/tournament.models';
import { AdminTeam } from '../../../../../@core/models/team.models';
import { Teams } from '../../../../../@core/services/teams';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { ImageUpload } from '../../../../../@core/services/image-upload';
import { Notifications } from '../../../../../@core/services/notifications';
import { getErrorMessage } from '../../../../../@core/utils/http-error';

@Component({
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    LucideImagePlus,
    LucideTrophy,
  ],
  templateUrl: './create-tournament.html',
  styleUrl: './create-tournament.scss',
})
export class CreateTournament {
  private readonly dialogRef = inject(MatDialogRef<CreateTournament>);
  private readonly tournamentService = inject(Tournaments);
  private readonly teamsService = inject(Teams);
  private readonly imageUpload = inject(ImageUpload);
  private readonly notifications = inject(Notifications);

  readonly tournament = inject(MAT_DIALOG_DATA, { optional: true }) as AdminTournament | null;
  readonly isEdit = Boolean(this.tournament);

  readonly categories = ['SUB 9', 'SUB 12', 'SUB 15', 'SUB 18', 'Libre'];
  readonly torneoTipos = TORNEO_TIPOS;
  readonly torneoEstados = TORNEO_ESTATOS;
  readonly definicionesEmpate = DEFINICIONES_EMPATE;
  readonly criteriosDisponibles = CRITERIOS_DESEMPATE;

  readonly selectedCategories = signal<string[]>(['SUB 9', 'SUB 12']);
  readonly categoryError = signal(false);
  readonly bannerName = signal('');
  readonly bannerUrl = signal<string | null>(null);
  readonly uploadingBanner = signal(false);
  readonly requestError = signal(false);
  /** Motivo por el que no se pudo guardar, visible junto al botón (nunca falla en silencio). */
  readonly formError = signal('');
  readonly submitting = signal(false);

  readonly teams = signal<AdminTeam[]>([]);
  readonly loadingTeams = signal(true);
  readonly selectedTeams = signal<number[]>([]);
  readonly teamsError = signal(false);

  readonly diasJuego = signal<string[]>([]);
  readonly canchas = signal<string[]>(['Cancha Principal']);
  readonly cruces = signal<CruceConfig[]>([
    { fase: 'FINAL', nombre: 'Gran Final', local: 'POSICION_1', visitante: 'POSICION_2' },
    {
      fase: 'TERCER_LUGAR',
      nombre: 'Definición Tercer Lugar',
      local: 'POSICION_3',
      visitante: 'POSICION_4',
    },
  ]);
  readonly criteriosDesempate = signal<string[]>(CRITERIOS_DESEMPATE.map((criterio) => criterio.value));

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    organizer: new FormControl('Next Gen', { nonNullable: true, validators: [Validators.required] }),
    place: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl(''),
    status: new FormControl('PROGRAMADO', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),

    tipoTorneo: new FormControl('ROUND_ROBIN_CON_FINALES', { nonNullable: true }),
    totalEquipos: new FormControl(4, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(4)],
    }),
    horaInicioJornada: new FormControl('08:30', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    tiemposPorPartido: new FormControl(2, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    duracionTiempoMinutos: new FormControl(20, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    duracionDescansoMinutos: new FormControl(5, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),

    fase1Nombre: new FormControl('TODOS_CONTRA_TODOS', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fase1Descripcion: new FormControl('Round Robin simple', { nonNullable: true }),
    fase1TotalJornadas: new FormControl(3, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    fase1PermiteEmpate: new FormControl(true, { nonNullable: true }),
    puntuacionVictoria: new FormControl(3, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    puntuacionEmpate: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    puntuacionDerrota: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),

    faseDefNombre: new FormControl('FASE_DEFINITORIA', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    faseDefPermiteEmpate: new FormControl(false, { nonNullable: true }),
    definicionEmpate: new FormControl('PENALES', { nonNullable: true }),
  });

  constructor() {
    if (this.tournament) {
      this.applyTournament(this.tournament);
    }

    // Con estado "Próximamente" la sede y la fecha dejan de ser obligatorias
    this.form.controls.status.valueChanges.subscribe(() => this.syncOptionalFields());
    this.syncOptionalFields();

    // El motivo de bloqueo se limpia en cuanto el usuario vuelve a editar
    this.form.valueChanges.subscribe(() => {
      if (this.formError()) this.formError.set('');
    });

    // Si se reduce la cantidad de equipos, se recorta la selección actual.
    this.form.controls.totalEquipos.valueChanges.subscribe((max) => {
      const limit = typeof max === 'number' && max > 0 ? max : 0;
      this.selectedTeams.update((selected) => selected.slice(0, limit));
    });

    this.loadTeams();
  }

  /** Estado actual del torneo como "Próximamente". */
  esProximamente(): boolean {
    return isProximamente(this.form.controls.status.value);
  }

  /** Agrega o quita la obligatoriedad de sede y fecha según el estado elegido. */
  private syncOptionalFields(): void {
    const validators = this.esProximamente() ? [] : [Validators.required];
    this.form.controls.place.setValidators(validators);
    this.form.controls.startDate.setValidators(validators);
    this.form.controls.place.updateValueAndValidity({ emitEvent: false });
    this.form.controls.startDate.updateValueAndValidity({ emitEvent: false });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  isSelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  toggleCategory(category: string): void {
    this.selectedCategories.update((selected) =>
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category],
    );
    this.categoryError.set(false);
  }

  isTeamSelected(team: AdminTeam): boolean {
    return this.selectedTeams().includes(this.teamId(team));
  }

  isTeamDisabled(team: AdminTeam): boolean {
    return (
      !this.isTeamSelected(team) &&
      this.selectedTeams().length >= (Number(this.form.controls.totalEquipos.value) || 0)
    );
  }

  toggleTeam(team: AdminTeam): void {
    const id = this.teamId(team);

    if (!Number.isFinite(id)) {
      return;
    }

    const selected = this.selectedTeams();
    const max = Number(this.form.controls.totalEquipos.value) || 0;

    if (selected.includes(id)) {
      this.selectedTeams.set(selected.filter((item) => item !== id));
      this.teamsError.set(false);
      return;
    }

    if (selected.length >= max) {
      this.teamsError.set(true);
      return;
    }

    this.selectedTeams.set([...selected, id]);
    this.teamsError.set(false);
  }

  addDia(input: HTMLInputElement): void {
    const value = input.value;

    if (value && !this.diasJuego().includes(value)) {
      this.diasJuego.update((dias) => [...dias, value].sort());
    }

    input.value = '';
  }

  removeDia(dia: string): void {
    this.diasJuego.update((dias) => dias.filter((item) => item !== dia));
  }

  addCancha(input: HTMLInputElement): void {
    const value = input.value.trim();

    if (value && !this.canchas().includes(value)) {
      this.canchas.update((lista) => [...lista, value]);
    }

    input.value = '';
  }

  removeCancha(cancha: string): void {
    this.canchas.update((lista) => lista.filter((item) => item !== cancha));
  }

  addCruce(): void {
    this.cruces.update((lista) => [
      ...lista,
      { fase: '', nombre: '', local: 'POSICION_1', visitante: 'POSICION_2' },
    ]);
  }

  removeCruce(index: number): void {
    this.cruces.update((lista) => lista.filter((_, posicion) => posicion !== index));
  }

  updateCruce(index: number, field: keyof CruceConfig, event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.cruces.update((lista) =>
      lista.map((cruce, posicion) =>
        posicion === index ? { ...cruce, [field]: value } : cruce,
      ),
    );
  }

  toggleCriterio(value: string): void {
    this.criteriosDesempate.update((lista) =>
      lista.includes(value) ? lista.filter((item) => item !== value) : [...lista, value],
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.bannerName.set(file.name);
    this.uploadingBanner.set(true);
    this.imageUpload.upload(file, 'tournaments').subscribe({
      next: (url) => {
        this.bannerUrl.set(url);
        this.uploadingBanner.set(false);
      },
      error: (requestError: unknown) => {
        this.bannerUrl.set(null);
        this.uploadingBanner.set(false);
        this.bannerName.set('');
        this.notifications.error(getErrorMessage(requestError, 'No se pudo subir el banner del torneo.'));
      },
    });
    input.value = '';
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    if (this.uploadingBanner()) {
      this.formError.set('Espera a que termine de subir el banner del torneo.');
      return;
    }

    const totalEquipos = Number(this.form.controls.totalEquipos.value) || 0;
    const equiposInvalidos = this.selectedTeams().length !== totalEquipos;
    const faltanCategorias = !this.selectedCategories().length;

    if (this.form.invalid || faltanCategorias || equiposInvalidos) {
      this.form.markAllAsTouched();
      this.categoryError.set(faltanCategorias);
      this.teamsError.set(equiposInvalidos);
      this.formError.set(this.blockedMessage(totalEquipos, faltanCategorias, equiposInvalidos));
      return;
    }

    this.formError.set('');

    const raw = this.form.getRawValue();

    const payload: TournamentInput = {
      nombre: raw.name.trim(),
      categoria: this.selectedCategories().join(', '),
      banner: this.bannerUrl(),
      // Sin fecha (p. ej. estado "Próximamente") se envía null, nunca vacío
      fechaInicio: raw.startDate || null,
      fechaFin: raw.endDate || null,
      status: raw.status,
      equiposIds: this.selectedTeams(),
      duracionTiempoMinutos: raw.duracionTiempoMinutos,
      duracionDescansoMinutos: raw.duracionDescansoMinutos,
      formato_config: {
        organizer: raw.organizer,
        place: raw.place,
        description: raw.description,
        tipoTorneo: raw.tipoTorneo,
        totalEquipos: raw.totalEquipos,
        categoriasHabilitadas: this.selectedCategories(),
        diasJuego: this.diasJuego(),
        canchas: this.canchas(),
        horaInicioJornada: raw.horaInicioJornada,
        tiemposPorPartido: raw.tiemposPorPartido,
        duracionTiempoMinutos: raw.duracionTiempoMinutos,
        duracionDescansoMinutos: raw.duracionDescansoMinutos,
        fases: {
          fase1: {
            nombre: raw.fase1Nombre,
            descripcion: raw.fase1Descripcion,
            totalJornadas: raw.fase1TotalJornadas,
            permiteEmpate: raw.fase1PermiteEmpate,
            puntuacion: {
              victoria: raw.puntuacionVictoria,
              empate: raw.puntuacionEmpate,
              derrota: raw.puntuacionDerrota,
            },
          },
          faseDefinitoria: {
            nombre: raw.faseDefNombre,
            permiteEmpate: raw.faseDefPermiteEmpate,
            definicionEmpate: raw.definicionEmpate,
            cruces: this.cruces(),
          },
        },
        criteriosDesempate: this.criteriosDisponibles
          .filter((criterio) => this.criteriosDesempate().includes(criterio.value))
          .map((criterio) => criterio.value),
      },
    };

    this.submitting.set(true);
    this.requestError.set(false);

    const request$ = this.isEdit
      ? this.tournamentService.updateTournament(this.tournamentId(), payload)
      : this.tournamentService.createTournament(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.dialogRef.close(true);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.requestError.set(true);
        this.formError.set(getErrorMessage(error, 'No se pudo guardar el torneo. Inténtalo de nuevo.'));
      },
    });
  }

  /** Motivo visible junto al botón cuando no se puede guardar todavía. */
  private blockedMessage(totalEquipos: number, faltanCategorias: boolean, equiposInvalidos: boolean): string {
    if (equiposInvalidos) {
      return `Selecciona exactamente ${totalEquipos} equipos antes de guardar.`;
    }
    if (faltanCategorias) {
      return 'Selecciona al menos una categoría.';
    }
    return 'Revisa los campos marcados en rojo: faltan datos obligatorios.';
  }

  private teamId(team: AdminTeam): number {
    return Number(team.idEquipo ?? team.id);
  }

  private tournamentId(): string | number {
    return this.tournament?.idTorneo ?? this.tournament?.id ?? '';
  }

  private applyTournament(tournament: AdminTournament): void {
    const config = parseFormatoConfig(tournament.formato_config);
    const base = createDefaultFormatoConfig();
    const fase1 = config.fases?.fase1 ?? base.fases.fase1;
    const faseDefinitoria = config.fases?.faseDefinitoria ?? base.fases.faseDefinitoria;

    this.form.patchValue({
      name: tournament.nombre ?? tournament.name ?? '',
      organizer: config.organizer ?? 'Next Gen',
      place: config.place ?? '',
      startDate: toDateInput(tournament.fechaInicio ?? tournament.startDate ?? tournament.fecha_inicio),
      endDate: toDateInput(tournament.fechaFin ?? tournament.endDate ?? tournament.fecha_fin),
      status: tournament.status ?? 'PROGRAMADO',
      description: config.description ?? '',
      tipoTorneo: config.tipoTorneo ?? base.tipoTorneo,
      totalEquipos: config.totalEquipos ?? base.totalEquipos,
      horaInicioJornada: config.horaInicioJornada ?? base.horaInicioJornada,
      tiemposPorPartido: config.tiemposPorPartido ?? base.tiemposPorPartido,
      duracionTiempoMinutos: config.duracionTiempoMinutos ?? base.duracionTiempoMinutos,
      duracionDescansoMinutos: config.duracionDescansoMinutos ?? base.duracionDescansoMinutos,
      fase1Nombre: fase1.nombre,
      fase1Descripcion: fase1.descripcion,
      fase1TotalJornadas: fase1.totalJornadas,
      fase1PermiteEmpate: fase1.permiteEmpate,
      puntuacionVictoria: fase1.puntuacion.victoria,
      puntuacionEmpate: fase1.puntuacion.empate,
      puntuacionDerrota: fase1.puntuacion.derrota,
      faseDefNombre: faseDefinitoria.nombre,
      faseDefPermiteEmpate: faseDefinitoria.permiteEmpate,
      definicionEmpate: faseDefinitoria.definicionEmpate,
    });

    if (config.categoriasHabilitadas?.length) {
      this.selectedCategories.set([...config.categoriasHabilitadas]);
    } else if (tournament.categoria) {
      this.selectedCategories.set(
        tournament.categoria
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }

    this.diasJuego.set([...(config.diasJuego ?? [])]);
    this.canchas.set(config.canchas?.length ? [...config.canchas] : [...base.canchas]);
    this.cruces.set(faseDefinitoria.cruces.map((cruce) => ({ ...cruce })));
    this.criteriosDesempate.set(
      config.criteriosDesempate?.length
        ? [...config.criteriosDesempate]
        : [...base.criteriosDesempate],
    );
    this.bannerUrl.set(tournament.banner ?? null);
    this.bannerName.set(tournament.banner ? 'Banner actual' : '');
  }

  private loadTeams(): void {
    this.loadingTeams.set(true);

    const idTorneo = this.tournamentId();
    const inscritos$ =
      this.isEdit && idTorneo !== ''
        ? this.tournamentService.getTournamentTeams(idTorneo)
        : of<{ idEquipo: number }[]>([]);

    forkJoin({
      teams: this.teamsService.getAllTeams(),
      inscritos: inscritos$,
    }).subscribe({
      next: ({ teams, inscritos }) => {
        const data = teams as AdminTeam[] | { data?: AdminTeam[] };
        this.teams.set(Array.isArray(data) ? data : (data.data ?? []));
        this.selectedTeams.set(
          inscritos.map((equipo) => Number(equipo.idEquipo)).filter((id) => Number.isFinite(id)),
        );
        this.loadingTeams.set(false);
      },
      error: () => {
        this.teams.set([]);
        this.loadingTeams.set(false);
      },
    });
  }
}
