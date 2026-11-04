import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  LucideCheck,
  LucideInfo,
  LucideRotateCcw,
  LucideSave,
  LucideSparkles,
  LucideSwords,
} from '@lucide/angular';
import { TOURNAMENTS } from '../../public/events/tournaments.data';

function teamsDiffer(group: AbstractControl): ValidationErrors | null {
  const home = String(group.get('homeTeam')?.value ?? '').trim().toLowerCase();
  const away = String(group.get('awayTeam')?.value ?? '').trim().toLowerCase();

  return home && away && home === away ? { sameTeams: true } : null;
}

@Component({
  imports: [
    ReactiveFormsModule,
    LucideCheck,
    LucideInfo,
    LucideRotateCcw,
    LucideSave,
    LucideSparkles,
    LucideSwords,
  ],
  selector: 'app-admin-matches',
  styleUrl: './admin-matches.scss',
  templateUrl: './admin-matches.html',
})
export class AdminMatches {
  readonly tournaments = TOURNAMENTS.map((tournament) => tournament.name);

  readonly phases = [
    'Fase de grupos',
    'Octavos de final',
    'Cuartos de final',
    'Semifinal',
    'Final',
  ];

  readonly form = new FormGroup(
    {
      tournament: new FormControl(this.tournaments[0] ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      phase: new FormControl('Fase de grupos', { nonNullable: true }),
      homeTeam: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      awayTeam: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      date: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      time: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      venue: new FormControl('Cancha Principal', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      status: new FormControl('scheduled', { nonNullable: true }),
    },
    { validators: teamsDiffer },
  );

  readonly saved = signal(false);

  readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly summaryMatch = computed(() => {
    const homeTeam = this.formValue().homeTeam ?? '';
    const awayTeam = this.formValue().awayTeam ?? '';

    if (!homeTeam.trim() && !awayTeam.trim()) {
      return 'Por definir';
    }

    return `${homeTeam.trim() || 'Local'} vs ${awayTeam.trim() || 'Visitante'}`;
  });

  readonly summaryDate = computed(() => {
    const date = this.formValue().date ?? '';
    const time = this.formValue().time ?? '';

    if (!date) {
      return 'Por definir';
    }

    const [year, month, day] = date.split('-');
    const formattedDate = year && month && day ? `${day}/${month}/${year}` : date;

    return time ? `${formattedDate} · ${time}` : formattedDate;
  });

  readonly summaryStatus = computed(() => {
    const labels: Record<string, string> = {
      scheduled: 'Programado',
      live: 'En vivo',
      finished: 'Finalizado',
    };

    return labels[this.formValue().status ?? ''] ?? 'Por definir';
  });

  showError(controlName: 'homeTeam' | 'awayTeam' | 'date' | 'time' | 'venue'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  showSameTeamsError(): boolean {
    const control = this.form.controls.awayTeam;
    return (control.touched || control.dirty) && this.form.hasError('sameTeams');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saved.set(false);
      return;
    }

    this.saved.set(true);
  }

  resetForm(): void {
    this.form.reset({
      tournament: this.tournaments[0] ?? '',
      phase: 'Fase de grupos',
      venue: 'Cancha Principal',
      status: 'scheduled',
    });
    this.saved.set(false);
  }
}
