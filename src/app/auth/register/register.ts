import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideIdCard,
  LucideLock,
  LucideMail,
  LucideMapPin,
  LucidePhone,
  LucideUser,
} from '@lucide/angular';
import { Auth } from '../../@core/services/auth';
import { Notifications } from '../../@core/services/notifications';
import { getErrorMessage } from '../../@core/utils/http-error';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('clave')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordsMismatch: true };
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

@Component({
  imports: [
    RouterLink,
    ReactiveFormsModule,
    LucideArrowRight,
    LucideIdCard,
    LucideLock,
    LucideMail,
    LucideMapPin,
    LucidePhone,
    LucideUser,
  ],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly notifications = inject(Notifications);
  private readonly router = inject(Router);

  readonly form = new FormGroup(
    {
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      apellido: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      correo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(150)],
      }),
      tipoIdentificacion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(20)],
      }),
      identificacion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(50)],
      }),
      telefono: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(30)],
      }),
      direccion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(255)],
      }),
      clave: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatch },
  );

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly loading = signal(false);

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  showError(
    controlName:
      | 'nombre'
      | 'apellido'
      | 'correo'
      | 'tipoIdentificacion'
      | 'identificacion'
      | 'telefono'
      | 'direccion'
      | 'clave',
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  showConfirmError(): boolean {
    const control = this.form.controls.confirmPassword;
    return (control.touched || control.dirty) && this.form.hasError('passwordsMismatch');
  }

  onSubmit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const correo = raw.correo.trim();

    this.loading.set(true);

    this.auth
      .register({
        nombre: raw.nombre.trim(),
        apellido: raw.apellido.trim(),
        correo,
        clave: raw.clave,
        tipoIdentificacion: optional(raw.tipoIdentificacion),
        identificacion: optional(raw.identificacion),
        telefono: optional(raw.telefono),
        direccion: optional(raw.direccion),
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.notifications.success(response.message || 'Cuenta creada con éxito.');
          void this.router.navigate(['/login'], { state: { correo } });
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.notifications.error(
            getErrorMessage(error, 'No pudimos crear tu cuenta. Intenta nuevamente.'),
          );
        },
      });
  }
}
