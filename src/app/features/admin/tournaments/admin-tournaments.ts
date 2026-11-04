import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  LucideTrophy,
} from '@lucide/angular';
import { Tournaments } from '../../../@core/services/tournaments';
import { CreateTournament } from './components/create-tournament/create-tournament';
import { UpdateTournament } from './components/update-tournament/update-tournament';


export interface AdminTournament {
  id?: string | number;
  name?: string;
  nombre?: string;
  organizer?: string;
  organizador?: string;
  place?: string;
  sede?: string;
  startDate?: string;
  fecha_inicio?: string;
  endDate?: string;
  fecha_fin?: string;
  status?: string;
  estado?: string;
  categories?: string[];
  categorias?: string[];
  slots?: number | string;
  cupo?: number | string;
  description?: string;
  banner?: string;
  image?: string;
}


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
    const dialogRef = this.dialog.open(UpdateTournament, {
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

  private loadTournaments(): void {
    this.loading.set(true);
    this.tournamentService.getAllTournaments().subscribe({
      next: (response: unknown) => {
        const data = response as { data?: AdminTournament[] } | AdminTournament[];
        this.tournaments.set(Array.isArray(data) ? data : data.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.tournaments.set([]);
        this.loading.set(false);
      },
    });
  }
}
