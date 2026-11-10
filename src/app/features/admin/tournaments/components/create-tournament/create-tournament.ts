import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideImagePlus, LucideTrophy } from '@lucide/angular';
import { forkJoin, of } from 'rxjs';
import {
  CategoriaEquiposInput,
  CRITERIOS_DESEMPATE,
  AdminTournament,
  CruceConfig,
  DEFINICIONES_EMPATE,
  isProximamente,
  normalizeCategory,
  sameCategory,
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
import {
  DateValue,
  formatDisplayDate,
  formatDisplayDayDate,
  toDateOnly,
  toLocalDate,
  toTimeOnly,
} from '../../../../../@core/utils/datetime';

@Component({
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTimepickerModule,
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
  /** Equipos elegidos por categoría: `{ 'SUB 9': [1,2,3,4] }` (clave = etiqueta de la categoría). */
  readonly teamsByCategory = signal<Record<string, number[]>>({});
  readonly teamsError = signal(false);

  readonly diasJuego = signal<string[]>([]);
  /** Día elegido en el datepicker de "Agregar día de juego". */
  readonly nuevoDia = new FormControl<DateValue>(null);
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
    // Fechas y hora: string del backend al cargar, Date al elegir en el picker
    startDate: new FormControl<DateValue>('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl<DateValue>(''),
    status: new FormControl('PROGRAMADO', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),

    tipoTorneo: new FormControl('ROUND_ROBIN_CON_FINALES', { nonNullable: true }),
    totalEquipos: new FormControl(4, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(4)],
    }),
    horaInicioJornada: new FormControl<DateValue>('08:30', {
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

    // Si se reduce la cantidad de equipos por categoría, se recorta cada selección.
    this.form.controls.totalEquipos.valueChanges.subscribe((max) => {
      const limit = typeof max === 'number' && max > 0 ? max : 0;
      this.teamsByCategory.update((map) => {
        const next: Record<string, number[]> = {};
        for (const [categoria, equipos] of Object.entries(map)) {
          next[categoria] = equipos.slice(0, limit);
        }
        return next;
      });
      this.teamsError.set(false);
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
    this.form.controls.endDate.setValidators(validators);
    this.form.controls.place.updateValueAndValidity({ emitEvent: false });
    this.form.controls.startDate.updateValueAndValidity({ emitEvent: false });
    this.form.controls.endDate.updateValueAndValidity({ emitEvent: false });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  isSelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  toggleCategory(category: string): void {
    const activa = this.selectedCategories().includes(category);

    this.selectedCategories.update((selected) =>
      activa ? selected.filter((item) => item !== category) : [...selected, category],
    );

    // Al quitar una categoría se descartan sus equipos elegidos.
    if (activa) {
      this.teamsByCategory.update((map) => {
        if (!(category in map)) return map;
        const next = { ...map };
        delete next[category];
        return next;
      });
    }

    this.categoryError.set(false);
    this.teamsError.set(false);
  }

  /** Equipos por categoría del torneo (cantidad exigida para poder guardar). */
  equiposPorCategoria(): number {
    return Number(this.form.controls.totalEquipos.value) || 0;
  }

  /** Selección actual de una categoría. */
  selectionFor(category: string): number[] {
    return this.teamsByCategory()[category] ?? [];
  }

  /** Equipos elegidos en una categoría (para el contador "n / total"). */
  selectedCount(category: string): number {
    return this.selectionFor(category).length;
  }

  /**
   * Equipos disponibles en una categoría: los de esa categoría, los que todavía
   * no tienen categoría cargada y los de categorías que el formulario no
   * conoce (p. ej. SUB-10), que pueden inscribirse en la que haga falta.
   */
  teamsForCategory(category: string): AdminTeam[] {
    const claveCategoria = normalizeCategory(category);

    return this.teams().filter((team) => {
      const claveEquipo = normalizeCategory(team.categoria);
      if (!claveEquipo) return true;
      if (claveEquipo === claveCategoria) return true;
      return !this.categories.some((known) => normalizeCategory(known) === claveEquipo);
    });
  }

  /** Categorías seleccionadas que no tienen exactamente "Equipos por categoría" equipos. */
  private invalidSelectionCategories(): string[] {
    const max = this.equiposPorCategoria();
    return this.selectedCategories().filter((category) => this.selectionFor(category).length !== max);
  }

  isTeamSelected(category: string, team: AdminTeam): boolean {
    return this.selectionFor(category).includes(this.teamId(team));
  }

  /** Un equipo no se puede elegir si la categoría está llena o ya está en otra categoría. */
  isTeamDisabled(category: string, team: AdminTeam): boolean {
    if (this.isTeamSelected(category, team)) {
      return false;
    }

    const id = this.teamId(team);

    if (this.selectionFor(category).length >= this.equiposPorCategoria()) {
      return true;
    }

    // El backend no admite un equipo inscrito en dos categorías a la vez.
    return this.selectedCategories().some(
      (otra) => otra !== category && this.selectionFor(otra).includes(id),
    );
  }

  toggleTeam(category: string, team: AdminTeam): void {
    const id = this.teamId(team);

    if (!Number.isFinite(id)) {
      return;
    }

    const selected = this.selectionFor(category);
    const max = this.equiposPorCategoria();

    if (selected.includes(id)) {
      this.teamsByCategory.update((map) => ({ ...map, [category]: selected.filter((item) => item !== id) }));
      this.teamsError.set(false);
      return;
    }

    const enOtraCategoria = this.selectedCategories().some(
      (otra) => otra !== category && this.selectionFor(otra).includes(id),
    );

    if (selected.length >= max || enOtraCategoria) {
      this.teamsError.set(true);
      return;
    }

    this.teamsByCategory.update((map) => ({ ...map, [category]: [...selected, id] }));
    this.teamsError.set(false);
  }

  addDia(): void {
    // Fecha inválida o fuera del rango inicio-cierre: el datepicker ya la marca
    if (this.nuevoDia.invalid) {
      this.nuevoDia.markAsTouched();
      return;
    }

    const value = toDateOnly(this.nuevoDia.value);

    if (value && !this.diasJuego().includes(value)) {
      this.diasJuego.update((dias) => [...dias, value].sort());
    }

    this.nuevoDia.reset(null);
  }

  /** "sáb 05/12/2026" para los chips de días de juego. */
  displayDia(dia: string): string {
    return formatDisplayDayDate(dia);
  }

  /** Explica para qué se usa cada día de juego. */
  diasHint(): string {
    return this.tieneFinales()
      ? 'El último día se juegan solo el tercer lugar y la final; los anteriores, la fase de grupos.'
      : 'Los partidos se reparten entre estos días.';
  }

  /** El formato "todos contra todos" puro no tiene tercer lugar ni final. */
  private tieneFinales(): boolean {
    return this.form.controls.tipoTorneo.value !== 'ROUND_ROBIN';
  }

  /** Motivo por el que las fechas o los días de juego no sirven ('' si están bien). */
  private calendarError(): string {
    if (this.esProximamente()) return '';

    const inicio = toDateOnly(this.form.controls.startDate.value);
    const fin = toDateOnly(this.form.controls.endDate.value);
    if (!inicio || !fin) return 'Indica la fecha de inicio y la de cierre del torneo.';
    if (fin < inicio) return 'La fecha de cierre no puede ser anterior a la de inicio.';

    const minimo = this.tieneFinales() ? 2 : 1;
    if (this.diasJuego().length < minimo) {
      return this.tieneFinales()
        ? 'Agrega al menos 2 días de juego: los de la fase de grupos y el último para el tercer lugar y la final.'
        : 'Agrega al menos un día de juego.';
    }

    const fuera = this.diasJuego().find((dia) => dia < inicio || dia > fin);
    return fuera
      ? `El día ${formatDisplayDate(fuera)} está fuera de las fechas del torneo. Quítalo o cambia las fechas.`
      : '';
  }

  /** Límites de los datepickers: los días de juego van entre inicio y cierre. */
  minDia(): Date | null {
    return toLocalDate(this.form.controls.startDate.value);
  }

  maxDia(): Date | null {
    return toLocalDate(this.form.controls.endDate.value);
  }

  removeDia(dia: string): void {
    this.diasJuego.update((dias) => dias.filter((item) => item !== dia));
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

    const maxEquipos = this.equiposPorCategoria();
    const grupos: CategoriaEquiposInput[] = this.selectedCategories().map((categoria) => ({
      categoria,
      equiposIds: this.selectionFor(categoria),
    }));
    const incompletas = this.invalidSelectionCategories();
    const equiposInvalidos = incompletas.length > 0;
    const faltanCategorias = !this.selectedCategories().length;

    if (this.form.invalid || faltanCategorias || equiposInvalidos) {
      this.form.markAllAsTouched();
      this.categoryError.set(faltanCategorias);
      this.teamsError.set(equiposInvalidos);
      this.formError.set(this.blockedMessage(maxEquipos, incompletas, faltanCategorias));
      return;
    }

    const errorCalendario = this.calendarError();
    if (errorCalendario) {
      this.formError.set(errorCalendario);
      return;
    }

    this.formError.set('');

    const raw = this.form.getRawValue();

    const payload: TournamentInput = {
      nombre: raw.name.trim(),
      categoria: this.selectedCategories().join(', '),
      banner: this.bannerUrl(),
      // Sin fecha (p. ej. estado "Próximamente") se envía null, nunca vacío
      fechaInicio: toDateOnly(raw.startDate) || null,
      fechaFin: toDateOnly(raw.endDate) || null,
      status: raw.status,
      // Lista plana (unión de todas las categorías) para torneos antiguos +
      // grupos por categoría para el fixture independiente de cada una.
      equiposIds: [...new Set(grupos.flatMap((grupo) => grupo.equiposIds))],
      categorias: grupos,
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
        horaInicioJornada: toTimeOnly(raw.horaInicioJornada),
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
  private blockedMessage(
    maxEquipos: number,
    incompletas: string[],
    faltanCategorias: boolean,
  ): string {
    if (incompletas.length) {
      return `Selecciona exactamente ${maxEquipos} equipos en: ${incompletas.join(', ')}.`;
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
        this.teamsByCategory.set(
          this.restoreSelection(
            inscritos.map((equipo) => Number(equipo.idEquipo)).filter((id) => Number.isFinite(id)),
          ),
        );
        this.loadingTeams.set(false);
      },
      error: () => {
        this.teams.set([]);
        this.loadingTeams.set(false);
      },
    });
  }

  /**
   * Reparte los equipos inscritos entre las categorías seleccionadas al editar:
   * primero se respeta el agrupamiento guardado (gruposPorCategoria); si no
   * existe (torneo antiguo de fixture único) se agrupa por la categoría de cada
   * equipo. Lo que no encaje en ninguna categoría va a la primera seleccionada
   * para que no se pierda al guardar.
   */
  private restoreSelection(inscritosIds: number[]): Record<string, number[]> {
    const seleccionadas = this.selectedCategories();
    const inscritos = new Set(inscritosIds);
    const resultado: Record<string, number[]> = {};

    for (const categoria of seleccionadas) {
      resultado[categoria] = [];
    }

    if (!seleccionadas.length || !inscritos.size) {
      return resultado;
    }

    const config = this.tournament ? parseFormatoConfig(this.tournament.formato_config) : {};
    const guardados = Array.isArray(config.gruposPorCategoria) ? config.gruposPorCategoria : [];
    const asignados = new Set<number>();

    const agregar = (categoria: string, ids: number[]): void => {
      if (!(categoria in resultado)) return;
      for (const id of ids) {
        if (!inscritos.has(id) || asignados.has(id)) continue;
        resultado[categoria].push(id);
        asignados.add(id);
      }
    };

    if (guardados.length) {
      // 1. Agrupamiento por categoría guardado por el backend
      for (const grupo of guardados) {
        const categoria = seleccionadas.find((cat) => sameCategory(cat, grupo.categoria));
        if (categoria) agregar(categoria, grupo.equiposIds ?? []);
      }
    } else {
      // 2. Torneo antiguo (fixture único): agrupar por la categoría del equipo
      for (const equipo of this.teams()) {
        const id = this.teamId(equipo);
        if (!inscritos.has(id)) continue;
        const categoria = seleccionadas.find((cat) => sameCategory(equipo.categoria, cat));
        if (categoria) agregar(categoria, [id]);
      }
    }

    // 3. Equipos sin categoría conocida: a la primera categoría seleccionada
    agregar(seleccionadas[0], [...inscritos].filter((id) => !asignados.has(id)));

    return resultado;
  }
}
