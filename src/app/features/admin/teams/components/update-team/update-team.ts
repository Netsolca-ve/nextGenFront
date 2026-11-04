import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideShield } from '@lucide/angular';
import { Teams } from '../../../../../@core/services/teams';
import { AdminTeam } from '../../admin-teams';

@Component({
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, LucideShield],
  templateUrl: './update-team.html',
  styleUrl: '../create-team/create-team.scss',
})
export class UpdateTeam {
  private readonly ref = inject(MatDialogRef<UpdateTeam>);
  private readonly service = inject(Teams);
  readonly team = inject(MAT_DIALOG_DATA) as AdminTeam;
  readonly error = signal(false);
  readonly form = new FormGroup({
    nombre: new FormControl(this.team.nombre ?? this.team.name ?? '', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    slug: new FormControl(this.team.slug ?? '', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    siglas: new FormControl(this.team.siglas ?? '', { nonNullable: true, validators: [Validators.maxLength(10)] }),
    categoria: new FormControl(this.team.categoria ?? this.team.category ?? '', { nonNullable: true, validators: [Validators.maxLength(50)] }),
    logo: new FormControl(this.team.logo ?? '', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    colorLocal: new FormControl(this.team.colorLocal ?? '#0284c7', { nonNullable: true }),
    colorVisitante: new FormControl(this.team.colorVisitante ?? '#ffffff', { nonNullable: true }),
    horarioEntrenamientos: new FormControl(this.team.horarioEntrenamientos ?? '', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    diasEntrenamientos: new FormControl(this.team.diasEntrenamientos ?? '', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    idAcademia: new FormControl<number | null>(this.team.idAcademia ?? null),
    idEntrenador: new FormControl<number | null>(this.team.idEntrenador ?? null),
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.service.updateTeam(this.team.id ?? '', this.form.getRawValue()).subscribe({ next: () => this.ref.close(true), error: () => this.error.set(true) });
  }
}