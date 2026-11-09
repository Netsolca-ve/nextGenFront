import { DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideImagePlus, LucidePencil, LucideUsers, LucideX } from '@lucide/angular';
import {
  AdminTeam,
  CreatePlayerInput,
  IDENTIFICATION_TYPES,
  PLAYER_POSITIONS,
  positionLabel,
  TeamPlayer,
} from '../../../../../@core/models/team.models';
import { ImageUpload } from '../../../../../@core/services/image-upload';
import { Notifications } from '../../../../../@core/services/notifications';
import { Teams } from '../../../../../@core/services/teams';
import { assetUrl } from '../../../../../@core/utils/asset-url';
import { getErrorMessage } from '../../../../../@core/utils/http-error';

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

@Component({
  imports: [
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    LucideImagePlus,
    LucidePencil,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './team-players.html',
  styleUrl: './team-players.scss',
})
export class TeamPlayers {
  private readonly teams = inject(Teams);
  private readonly imageUpload = inject(ImageUpload);
  private readonly notifications = inject(Notifications);
  readonly team = inject(MAT_DIALOG_DATA) as AdminTeam;

  readonly identificationTypes = IDENTIFICATION_TYPES;
  readonly positions = PLAYER_POSITIONS;
  readonly positionLabel = positionLabel;
  readonly assetUrl = assetUrl;
  readonly players = signal<TeamPlayer[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly uploadingPhoto = signal(false);
  readonly photoPreview = signal<string | null>(null);
  readonly error = signal(false);
  readonly editingPlayer = signal<TeamPlayer | null>(null);

  private readonly formSection = viewChild<ElementRef<HTMLElement>>('formSection');
  private readonly firstInput = viewChild<ElementRef<HTMLInputElement>>('firstInput');

  readonly form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    apellido: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    tipoIdentificacion: new FormControl('V', { nonNullable: true }),
    identificacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(50)],
    }),
    fechaNacimiento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    numeroCamiseta: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(0),
        Validators.max(999),
      ],
    }),
    foto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    posicion: new FormControl<string>('Jugador', {
      nonNullable: true,
      validators: [Validators.maxLength(50)],
    }),
  });

  constructor() {
    this.loadPlayers();
  }

  get teamName(): string {
    return this.team.nombre || this.team.name || 'Equipo';
  }

  initials(player: TeamPlayer): string {
    const initials = `${player.nombre?.[0] ?? ''}${player.apellido?.[0] ?? ''}`;
    return initials.toUpperCase() || 'J';
  }

  showError(
    controlName: 'nombre' | 'apellido' | 'fechaNacimiento' | 'numeroCamiseta',
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.uploadingPhoto.set(true);
    this.imageUpload.upload(file, 'players').subscribe({
      next: (url) => {
        this.form.controls.foto.setValue(url);
        this.photoPreview.set(url);
        this.uploadingPhoto.set(false);
      },
      error: (uploadError: unknown) => {
        this.uploadingPhoto.set(false);
        this.notifications.error(
          getErrorMessage(uploadError, 'No se pudo subir la foto del jugador.'),
        );
      },
    });

    input.value = '';
  }

  submitPlayer(): void {
    if (this.submitting() || this.uploadingPhoto()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const editing = this.editingPlayer();

    if (editing) {
      this.updatePlayer(editing);
    } else {
      this.addPlayer();
    }
  }

  editPlayer(player: TeamPlayer): void {
    this.editingPlayer.set(player);
    this.form.patchValue({
      nombre: player.nombre ?? '',
      apellido: player.apellido ?? '',
      tipoIdentificacion: player.tipoIdentificacion || 'V',
      identificacion: player.identificacion ?? '',
      fechaNacimiento: (player.fechaNacimiento ?? '').slice(0, 10),
      numeroCamiseta: player.numeroCamiseta,
      foto: player.foto ?? '',
      posicion: positionLabel(player.posicion),
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.photoPreview.set(player.foto || null);

    this.formSection()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => this.firstInput()?.nativeElement.focus({ preventScroll: true }), 300);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private buildPayload(): CreatePlayerInput {
    const raw = this.form.getRawValue();
    return {
      nombre: raw.nombre.trim(),
      apellido: raw.apellido.trim(),
      tipoIdentificacion: optional(raw.tipoIdentificacion),
      identificacion: optional(raw.identificacion),
      fechaNacimiento: raw.fechaNacimiento,
      numeroCamiseta: Number(raw.numeroCamiseta),
      foto: optional(raw.foto),
      posicion: optional(raw.posicion),
    };
  }

  private updatePlayer(player: TeamPlayer): void {
    this.submitting.set(true);
    this.error.set(false);

    this.teams.updatePlayer(player.idJugador, this.buildPayload()).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.notifications.success(response?.message || 'Jugador actualizado.');
        this.resetForm();
        this.loadPlayers();
      },
      error: (requestError: unknown) => {
        this.submitting.set(false);
        this.error.set(true);
        this.notifications.error(
          getErrorMessage(requestError, 'No se pudo actualizar el jugador.'),
        );
      },
    });
  }

  private addPlayer(): void {
    const idEquipo = this.team.idEquipo ?? this.team.id;

    if (idEquipo === undefined || idEquipo === null || idEquipo === '') {
      this.error.set(true);
      this.notifications.error('No se encontró el equipo para añadir jugadores.');
      return;
    }

    const payload = this.buildPayload();

    this.submitting.set(true);
    this.error.set(false);

    this.teams.addPlayer(Number(idEquipo), payload).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.notifications.success(response.message || 'Jugador añadido a la plantilla.');
        this.resetForm();
        this.loadPlayers();
      },
      error: (requestError: unknown) => {
        this.submitting.set(false);
        this.error.set(true);
        this.notifications.error(
          getErrorMessage(requestError, 'No se pudo añadir el jugador.'),
        );
      },
    });
  }

  removePlayer(player: TeamPlayer): void {
    const name = `${player.nombre} ${player.apellido}`.trim();

    if (!window.confirm(`¿Quitar a ${name} de la plantilla?`)) {
      return;
    }

    this.teams.deletePlayer(player.idJugador).subscribe({
      next: (response) => {
        if (this.editingPlayer()?.idJugador === player.idJugador) {
          this.resetForm();
        }
        this.notifications.success(response.message || 'Jugador retirado de la plantilla.');
        this.loadPlayers();
      },
      error: (requestError: unknown) => {
        this.notifications.error(
          getErrorMessage(requestError, 'No se pudo quitar el jugador.'),
        );
      },
    });
  }

  private loadPlayers(): void {
    const idEquipo = this.team.idEquipo ?? this.team.id;

    if (idEquipo === undefined || idEquipo === null || idEquipo === '') {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    this.loading.set(true);
    this.teams.getPlayers(Number(idEquipo)).subscribe({
      next: (players) => {
        this.players.set(players);
        this.loading.set(false);
      },
      error: (requestError: unknown) => {
        this.players.set([]);
        this.loading.set(false);
        this.notifications.error(
          getErrorMessage(requestError, 'No se pudo cargar la plantilla del equipo.'),
        );
      },
    });
  }

  private resetForm(): void {
    this.form.patchValue({
      nombre: '',
      apellido: '',
      tipoIdentificacion: 'V',
      identificacion: '',
      fechaNacimiento: '',
      numeroCamiseta: null,
      foto: '',
      posicion: 'Jugador',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.photoPreview.set(null);
    this.editingPlayer.set(null);
  }
}
