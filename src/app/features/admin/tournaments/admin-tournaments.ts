import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  LucideTrophy,
} from '@lucide/angular';
import {
  AdminTournament,
  TORNEO_ESTATOS,
  parseFormatoConfig,
  toDateInput,
} from '../../../@core/models/tournament.models';
import { Tournaments } from '../../../@core/services/tournaments';
import { CreateTournament } from './components/create-tournament/create-tournament';

export type { AdminTournament };

@Component({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    LucideTrophy,
  ],
  selector: 'app-admin-tournaments',
  styleUrl: './admin-tournaments.scss',
  templateUrl: './admin-tournaments.html',
})
export class AdminTournaments {
  private readonly dialog = inject(MatDialog);
  private readonly tournamentService = inject(Tournaments);

  readonly tournaments = signal<AdminTournament[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.loadTournaments();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateTournament, {
      panelClass: 'adminTournamentDialog',
      width: 'min(760px, calc(100vw - 32px))',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.loadTournaments();
      }
    });
  }

  openUpdateDialog(tournament: AdminTournament): void {
    const dialogRef = this.dialog.open(CreateTournament, {
      data: tournament,
      panelClass: 'adminTournamentDialog',
      width: 'min(760px, calc(100vw - 32px))',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadTournaments();
      }
    });
  }

  /** Completa los datos de presentación que el backend guarda dentro de formato_config. */
  private normalizeTournament(row: AdminTournament): AdminTournament {
    const config = parseFormatoConfig(row.formato_config);

    return {
      ...row,
      id: row.id ?? row.idTorneo,
      name: row.name ?? row.nombre,
      organizer: row.organizer ?? row.organizador ?? config.organizer,
      place: row.place ?? row.sede ?? config.place,
      description: row.description ?? config.description,
      startDate: row.startDate ?? toDateInput(row.fechaInicio ?? row.fecha_inicio),
      endDate: row.endDate ?? toDateInput(row.fechaFin ?? row.fecha_fin),
      categories: row.categories ?? row.categorias ?? config.categoriasHabilitadas,
      estado:
        TORNEO_ESTATOS.find((estado) => estado.value === row.status)?.label ?? row.status,
      banner: row.banner ?? row.image,
    };
  }

  private loadTournaments(): void {
    this.loading.set(true);
    this.tournamentService.getAllTournaments().subscribe({
      next: (response: unknown) => {
        const data = response as { data?: AdminTournament[] } | AdminTournament[];
        const rows = Array.isArray(data) ? data : data.data ?? [];
        this.tournaments.set(rows.map((row) => this.normalizeTournament(row)));
        this.loading.set(false);
      },
      error: () => {
        this.tournaments.set([]);
        this.loading.set(false);
      },
    });
  }
}
