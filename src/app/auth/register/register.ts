import { Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideLock, LucideMail, LucideUser } from '@lucide/angular';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  imports: [RouterLink, ReactiveFormsModule, LucideArrowRight, LucideLock, LucideMail, LucideUser],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  readonly form = new FormGroup(
    {
      fullName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
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

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  showError(controlName: 'fullName' | 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  showConfirmError(): boolean {
    const control = this.form.controls.confirmPassword;
    return (control.touched || control.dirty) && this.form.hasError('passwordsMismatch');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
  }
}
