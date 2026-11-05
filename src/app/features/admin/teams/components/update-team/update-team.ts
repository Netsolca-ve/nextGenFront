import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideImagePlus, LucideShield, LucideUsers } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import {
  AcademyOption,
  AdminTeam,
  CoachOption,
  TEAM_CATEGORIES,
  TeamInput,
} from '../../../../../@core/models/team.models';
import { ImageUpload } from '../../../../../@core/services/image-upload';
import { Notifications } from '../../../../../@core/services/notifications';
import { Teams } from '../../../../../@core/services/teams';
import { assetUrl } from '../../../../../@core/utils/asset-url';
import { getErrorMessage } from '../../../../../@core/utils/http-error';
import { TeamPlayers } from '../team-players/team-players';

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

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
    LucideShield,
    LucideUsers,
  ],
  templateUrl: './update-team.html',
  styleUrl: '../create-team/create-team.scss',
})
export class UpdateTeam {
  private readonly dialogRef = inject(MatDialogRef<UpdateTeam>);
  private readonly dialog = inject(MatDialog);
  private readonly teams = inject(Teams);
  private readonly imageUpload = inject(ImageUpload);
  private readonly notifications = inject(Notifications);
  readonly team = inject(MAT_DIALOG_DATA) as AdminTeam;

  readonly categories: string[] = [...TEAM_CATEGORIES];
  readonly assetUrl = assetUrl;
  readonly academies = signal<AcademyOption[]>([]);
  readonly coaches = signal<CoachOption[]>([]);
  readonly hasAcademy = signal(Boolean(this.team.idAcademia));
  readonly logoPreview = signal<string | null>(this.team.logo ?? this.team.image ?? null);
  readonly uploadingLogo = signal(false);
  readonly loadingCatalogs = signal(true);
  readonly submitting = signal(false);
  readonly error = signal(false);

  readonly form = new FormGroup({
    nombre: new FormControl(this.team.nombre ?? this.team.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    siglas: new FormControl(this.team.siglas ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3)],
    }),
    categoria: new FormControl(this.team.categoria ?? this.team.category ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    logo: new FormControl(this.team.logo ?? this.team.image ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    colorLocal: new FormControl(this.team.colorLocal ?? '#0284c7', { nonNullable: true }),
    colorVisitante: new FormControl(this.team.colorVisitante ?? '#ffffff', {
      nonNullable: true,
    }),
    horarioEntrenamientos: new FormControl(this.team.horarioEntrenamientos ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    diasEntrenamientos: new FormControl(this.team.diasEntrenamientos ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(150)],
    }),
    idAcademia: new FormControl<number | null>(this.team.idAcademia ?? null),
    idEntrenador: new FormControl<number | null>(this.team.idEntrenador ?? null),
  });

  constructor() {
    const currentCategory = this.team.categoria ?? this.team.category;

    if (currentCategory && !this.categories.includes(currentCategory)) {
      this.categories.push(currentCategory);
    }

    if (this.hasAcademy()) {
      this.form.controls.idAcademia.addValidators(Validators.required);
      this.form.controls.idAcademia.updateValueAndValidity();
    }

    this.loadCatalogs();
  }

  showError(controlName: 'nombre' | 'siglas' | 'categoria' | 'idAcademia'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  onAcademyToggle(checked: boolean): void {
    this.hasAcademy.set(checked);
    const control = this.form.controls.idAcademia;

    if (checked) {
      control.addValidators(Validators.required);
    } else {
      control.clearValidators();
      control.setValue(null);
    }

    control.updateValueAndValidity();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.uploadingLogo.set(true);
    this.imageUpload.upload(file, 'teams').subscribe({
      next: (url) => {
        this.form.controls.logo.setValue(url);
        this.logoPreview.set(url);
        this.uploadingLogo.set(false);
      },
      error: (uploadError: unknown) => {
        this.uploadingLogo.set(false);
        this.notifications.error(
          getErrorMessage(uploadError, 'No se pudo subir el logo del equipo.'),
        );
      },
    });

    input.value = '';
  }

  openPlayers(): void {
    const idEquipo = this.team.idEquipo ?? this.team.id;

    if (idEquipo === undefined || idEquipo === null || idEquipo === '') {
      this.notifications.error('No se encontró el equipo para gestionar la plantilla.');
      return;
    }

    this.dialog.open(TeamPlayers, {
      data: this.team,
      width: 'min(900px, calc(100vw - 20px))',
      maxHeight: '92vh',
    });
  }

  submit(): void {
    if (this.submitting() || this.uploadingLogo()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const idEquipo = this.team.idEquipo ?? this.team.id;

    if (idEquipo === undefined || idEquipo === null || idEquipo === '') {
      this.error.set(true);
      this.notifications.error('No se encontró el equipo a actualizar.');
      return;
    }

    const raw = this.form.getRawValue();
    const payload: Partial<TeamInput> = {
      nombre: raw.nombre.trim(),
      siglas: raw.siglas.trim().toUpperCase(),
      categoria: raw.categoria,
      logo: raw.logo || null,
      colorLocal: raw.colorLocal,
      colorVisitante: raw.colorVisitante,
      horarioEntrenamientos: optional(raw.horarioEntrenamientos),
      diasEntrenamientos: optional(raw.diasEntrenamientos),
      idAcademia: this.hasAcademy() ? raw.idAcademia : null,
      idEntrenador: raw.idEntrenador,
    };

    this.submitting.set(true);
    this.error.set(false);

    this.teams.updateTeam(idEquipo, payload).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.notifications.success(response.message || 'Equipo actualizado con éxito.');
        this.dialogRef.close(true);
      },
      error: (requestError: unknown) => {
        this.submitting.set(false);
        this.error.set(true);
        this.notifications.error(
          getErrorMessage(requestError, 'No se pudo actualizar el equipo.'),
        );
      },
    });
  }

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);

    forkJoin({
      academies: this.teams.getAcademies(),
      coaches: this.teams.getCoaches(),
    }).subscribe({
      next: ({ academies, coaches }) => {
        this.academies.set(academies);
        this.coaches.set(coaches);
        this.loadingCatalogs.set(false);
      },
      error: () => {
        this.academies.set([]);
        this.coaches.set([]);
        this.loadingCatalogs.set(false);
        this.notifications.error('No se pudieron cargar las academias y entrenadores.');
      },
    });
  }
}
