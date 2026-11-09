import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import {
  AcademyOption,
  AdminTeam,
  CoachOption,
  CreatePlayerInput,
  TeamInput,
  TeamPlayer,
} from '../models/team.models';

@Service()
export class Teams {
  private readonly http = inject(HttpClient);
  private readonly api = environment.api;

  getAllTeams() {
    return this.http.get<AdminTeam[] | { data: AdminTeam[] }>(`${this.api}/teams`);
  }

  getAcademies() {
    return this.http.get<AcademyOption[]>(`${this.api}/academies`);
  }

  getCoaches() {
    return this.http.get<CoachOption[]>(`${this.api}/coaches`);
  }

  createTeam(team: TeamInput) {
    return this.http.post<{ idEquipo: number; message: string }>(`${this.api}/teams`, team);
  }

  updateTeam(id: string | number, team: Partial<TeamInput>) {
    return this.http.put<{ message: string }>(`${this.api}/teams/${id}`, team);
  }

  getPlayers(idEquipo: number) {
    return this.http.get<TeamPlayer[]>(`${this.api}/teams/${idEquipo}/players`);
  }

  addPlayer(idEquipo: number, player: CreatePlayerInput) {
    return this.http.post<TeamPlayer & { message: string }>(
      `${this.api}/teams/${idEquipo}/players`,
      player,
    );
  }

  updatePlayer(idJugador: number, player: Partial<CreatePlayerInput>) {
    return this.http.put<{ message: string }>(
      `${this.api}/teams/players/${idJugador}`,
      player,
    );
  }

  deletePlayer(idJugador: number) {
    return this.http.delete<{ message: string }>(`${this.api}/teams/players/${idJugador}`);
  }
}
