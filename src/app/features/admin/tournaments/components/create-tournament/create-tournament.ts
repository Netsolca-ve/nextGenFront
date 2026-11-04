import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideImagePlus, LucideTrophy } from '@lucide/angular';
import { Tournaments } from '../../../../../@core/services/tournaments';

@Component({
  imports: [
    MatButtonModule,
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
  readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  readonly categories = ['SUB 9', 'SUB 12', 'SUB 15', 'SUB 18', 'Libre'];
  readonly selectedCategories = signal<string[]>(['SUB 9', 'SUB 12']);
  readonly categoryError = signal(false);
  readonly bannerName = signal('');
  readonly requestError = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    organizer: new FormControl('Next Gen', { nonNullable: true, validators: [Validators.required] }),
    place: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl(''),
    status: new FormControl('open', { nonNullable: true }),
    slots: new FormControl(''),
    description: new FormControl(''),
  });

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

  showError(controlName: 'name' | 'organizer' | 'place' | 'startDate'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bannerName.set(input.files?.[0]?.name ?? '');
  }

  submit(): void {
    if (this.form.invalid || !this.selectedCategories().length) {
      this.form.markAllAsTouched();
      this.categoryError.set(!this.selectedCategories().length);
      return;
    }

    this.tournamentService.createTournament({
      ...this.form.getRawValue(),
      categories: this.selectedCategories(),
    }).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.requestError.set(true),
    });
  }
}