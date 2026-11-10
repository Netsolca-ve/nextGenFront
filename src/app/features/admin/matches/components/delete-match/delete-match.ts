import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LucideTrash2 } from '@lucide/angular';
import { Matches } from '../../../../../@core/services/matches';
import { Notifications } from '../../../../../@core/services/notifications';
import { getErrorMessage } from '../../../../../@core/utils/http-error';

export interface DeleteMatchData {
  idPartido: number;
  /** Texto para identificar el partido, p. ej. "Equipo A 2 - 1 Equipo B". */
  title: string;
  /** Detalle secundario: fecha, torneo, fase. */
  subtitle?: string;
}

/**
 * Modal de confirmación para eliminar un partido. Hace la petición él mismo
 * para mostrar el estado de carga y cierra con `true` solo si se eliminó.
 */
@Component({
  selector: 'app-delete-match',
  imports: [MatButtonModule, MatDialogModule, LucideTrash2],
  templateUrl: './delete-match.html',
  styleUrl: './delete-match.scss',
})
export class DeleteMatch {
  private readonly matchesService = inject(Matches);
  private readonly notifications = inject(Notifications);
  private readonly dialogRef = inject<MatDialogRef<DeleteMatch, boolean>>(MatDialogRef);
  readonly data = inject<DeleteMatchData>(MAT_DIALOG_DATA);

  readonly deleting = signal(false);

  confirm(): void {
    if (this.deleting()) return;

    this.deleting.set(true);
    this.dialogRef.disableClose = true;

    this.matchesService.deleteMatch(this.data.idPartido).subscribe({
      next: (response) => {
        this.notifications.success(response?.message ?? 'Partido eliminado con éxito.');
        this.dialogRef.close(true);
      },
      error: (requestError: unknown) => {
        this.deleting.set(false);
        this.dialogRef.disableClose = false;
        this.notifications.error(getErrorMessage(requestError, 'No se pudo eliminar el partido.'));
      },
    });
  }
}
