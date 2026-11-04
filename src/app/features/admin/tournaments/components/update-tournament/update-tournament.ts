import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideTrophy } from '@lucide/angular';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { AdminTournament } from '../../admin-tournaments';

@Component({
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, LucideTrophy],
  selector: 'app-update-tournament',
  templateUrl: './update-tournament.html',
  styleUrl: '../create-tournament/create-tournament.scss',
})
export class UpdateTournament {
  private readonly ref = inject(MatDialogRef<UpdateTournament>);
  private readonly service = inject(Tournaments);
  readonly tournament = inject(MAT_DIALOG_DATA) as AdminTournament;
  readonly error = signal(false);

  readonly form = new FormGroup({
    name: new FormControl(this.tournament.name ?? this.tournament.nombre ?? '', { nonNullable: true, validators: [Validators.required] }),
    organizer: new FormControl(this.tournament.organizer ?? this.tournament.organizador ?? 'Next Gen', { nonNullable: true, validators: [Validators.required] }),
    place: new FormControl(this.tournament.place ?? this.tournament.sede ?? '', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl(this.tournament.startDate ?? this.tournament.fecha_inicio ?? '', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl(this.tournament.endDate ?? this.tournament.fecha_fin ?? ''),
    status: new FormControl(this.tournament.status ?? this.tournament.estado ?? 'open', { nonNullable: true }),
    slots: new FormControl(this.tournament.slots ?? this.tournament.cupo ?? ''),
    description: new FormControl(this.tournament.description ?? ''),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.service.updateTournament(this.tournament.id ?? '', this.form.getRawValue()).subscribe({
      next: () => this.ref.close(true),
      error: () => this.error.set(true),
    });
  }
}