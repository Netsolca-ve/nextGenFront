import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideShield } from '@lucide/angular';
import { Teams } from '../../../../../@core/services/teams';

@Component({
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, LucideShield],
  templateUrl: './create-team.html',
  styleUrl: './create-team.scss',
})
export class CreateTeam {
  private readonly ref = inject(MatDialogRef<CreateTeam>);
  private readonly service = inject(Teams);
  readonly error = signal(false);
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    siglas: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(10)] }),
    categoria: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    logo: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    colorLocal: new FormControl('#0284c7', { nonNullable: true }),
    colorVisitante: new FormControl('#ffffff', { nonNullable: true }),
    horarioEntrenamientos: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    diasEntrenamientos: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    idAcademia: new FormControl<number | null>(null),
    idEntrenador: new FormControl<number | null>(null),
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.service.createTeam(this.form.getRawValue()).subscribe({ next: () => this.ref.close(true), error: () => this.error.set(true) });
  }
}