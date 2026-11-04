import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucideShield, LucideUsers } from '@lucide/angular';
import { Teams } from '../../../@core/services/teams';
import { CreateTeam } from './components/create-team/create-team';
import { UpdateTeam } from './components/update-team/update-team';

export interface AdminTeam {
  id?: string | number;
  name?: string;
  nombre?: string;
  coach?: string;
  entrenador?: string;
  category?: string;
  categoria?: string;
  logo?: string;
  image?: string;
  members?: number | string;
  jugadores?: number | string;
  slug?: string;
  siglas?: string;
  colorLocal?: string;
  colorVisitante?: string;
  horarioEntrenamientos?: string;
  diasEntrenamientos?: string;
  idAcademia?: number | null;
  idEntrenador?: number | null;
}

@Component({
  imports: [MatButtonModule, MatCardModule, MatDialogModule, LucideShield, LucideUsers],
  selector: 'app-admin-teams',
  templateUrl: './admin-teams.html',
  styleUrl: './admin-teams.scss',
})
export class AdminTeams {
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(Teams);
  readonly teams = signal<AdminTeam[]>([]);
  readonly loading = signal(true);

  constructor() { this.loadTeams(); }

  openCreateDialog(): void {
    this.dialog.open(CreateTeam, { width: 'min(620px, calc(100vw - 32px))', maxHeight: '90vh' }).afterClosed().subscribe((saved) => saved && this.loadTeams());
  }

  openUpdateDialog(team: AdminTeam): void {
    this.dialog.open(UpdateTeam, { data: team, width: 'min(620px, calc(100vw - 32px))', maxHeight: '90vh' }).afterClosed().subscribe((saved) => saved && this.loadTeams());
  }

  private loadTeams(): void {
    this.loading.set(true);
    this.service.getAllTeams().subscribe({
      next: (response: unknown) => {
        const data = response as { data?: AdminTeam[] } | AdminTeam[];
        this.teams.set(Array.isArray(data) ? data : data.data ?? []);
        this.loading.set(false);
      },
      error: () => { this.teams.set([]); this.loading.set(false); },
    });
  }
}