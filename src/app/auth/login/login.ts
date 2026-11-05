import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowRight, LucideLock, LucideMail } from '@lucide/angular';
import { Auth } from '../../@core/services/auth';
import { Notifications } from '../../@core/services/notifications';
import { getErrorMessage } from '../../@core/utils/http-error';

@Component({
  imports: [RouterLink, ReactiveFormsModule, LucideArrowRight, LucideLock, LucideMail],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly auth = inject(Auth);
  private readonly notifications = inject(Notifications);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    clave: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly showPassword = signal(false);
  readonly loading = signal(false);

  ngOnInit(): void {
    if (typeof history === 'undefined') {
      return;
    }

    const state = history.state as { correo?: string } | null;

    if (state?.correo) {
      this.form.controls.correo.setValue(state.correo);
      history.replaceState({ ...state, correo: null }, '');
    }
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  showError(controlName: 'correo' | 'clave'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { correo, clave } = this.form.getRawValue();
    this.loading.set(true);

    this.auth.login({ correo: correo.trim(), clave }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.notifications.success(`Bienvenido, ${response.user.nombre}`);
        void this.router.navigateByUrl('/admin');
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.notifications.error(
          getErrorMessage(error, 'No pudimos iniciar sesión. Verifica tus datos.'),
        );
      },
    });
  }
}
