import { inject, Service } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Service()
export class Notifications {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, ['nextgen-snackbar', 'nextgen-snackbar--success'], 4500);
  }

  error(message: string): void {
    this.open(message, ['nextgen-snackbar', 'nextgen-snackbar--error'], 6500);
  }

  private open(message: string, panelClass: string[], duration: number): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass,
    });
  }
}
