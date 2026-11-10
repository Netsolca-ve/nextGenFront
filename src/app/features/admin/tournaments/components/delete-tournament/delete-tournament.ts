import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LucideTrash2 } from '@lucide/angular';
import { Tournaments } from '../../../../../@core/services/tournaments';
import { Notifications } from '../../../../../@core/services/notifications';
import { getErrorMessage } from '../../../../../@core/utils/http-error';

export interface DeleteTournamentData {
  idTorneo: string | number;
  nombre: string;
  /** Detalle secundario: fechas, categorías. */
  subtitle?: string;
}

/**
 * Modal de confirmación para eliminar un torneo. Hace la petición él mismo
 * para mostrar el estado de carga y cierra con `true` solo si se eliminó.
 */
@Component({
  selector: 'app-delete-tournament',
  imports: [MatButtonModule, MatDialogModule, LucideTrash2],
  templateUrl: './delete-tournament.html',
  styleUrl: './delete-tournament.scss',
})
export class DeleteTournament {
  private readonly tournamentsService = inject(Tournaments);
  private readonly notifications = inject(Notifications);
  private readonly dialogRef = inject<MatDialogRef<DeleteTournament, boolean>>(MatDialogRef);
  readonly data = inject<DeleteTournamentData>(MAT_DIALOG_DATA);

  readonly deleting = signal(false);

  confirm(): void {
    if (this.deleting()) return;

    this.deleting.set(true);
    this.dialogRef.disableClose = true;

    this.tournamentsService.deleteTournament(this.data.idTorneo).subscribe({
      next: (response) => {
        this.notifications.success(response?.message ?? 'Torneo eliminado con éxito.');
        this.dialogRef.close(true);
      },
      error: (requestError: unknown) => {
        this.deleting.set(false);
        this.dialogRef.disableClose = false;
        this.notifications.error(getErrorMessage(requestError, 'No se pudo eliminar el torneo.'));
      },
    });
  }
}
