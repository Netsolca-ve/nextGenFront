import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucideShield, LucideUsers } from '@lucide/angular';
import { AdminTeam } from '../../../@core/models/team.models';
import { Teams } from '../../../@core/services/teams';
import { assetUrl } from '../../../@core/utils/asset-url';
import { CreateTeam } from './components/create-team/create-team';
import { UpdateTeam } from './components/update-team/update-team';

@Component({
  imports: [MatButtonModule, MatCardModule, MatDialogModule, LucideShield, 
    ///LucideUsers
  ],
  selector: 'app-admin-teams',
  templateUrl: './admin-teams.html',
  styleUrl: './admin-teams.scss',
})
export class AdminTeams {
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(Teams);
  readonly teams = signal<AdminTeam[]>([]);
  readonly loading = signal(true);
  readonly assetUrl = assetUrl;

  constructor() {
    this.loadTeams();
  }

  openCreateDialog(): void {
    this.dialog
      .open(CreateTeam, { width: 'min(680px, calc(100vw - 32px))', maxHeight: '90vh' })
      .afterClosed()
      .subscribe((saved) => saved && this.loadTeams());
  }

  openUpdateDialog(team: AdminTeam): void {
    this.dialog
      .open(UpdateTeam, { data: team, width: 'min(760px, calc(100vw - 32px))', maxHeight: '90vh' })
      .afterClosed()
      .subscribe((saved) => saved && this.loadTeams());
  }

  private loadTeams(): void {
    this.loading.set(true);
    this.service.getAllTeams().subscribe({
      next: (response) => {
        const data = response as AdminTeam[] | { data?: AdminTeam[] };
        this.teams.set(Array.isArray(data) ? data : (data.data ?? []));
        this.loading.set(false);
      },
      error: () => {
        this.teams.set([]);
        this.loading.set(false);
      },
    });
  }
}