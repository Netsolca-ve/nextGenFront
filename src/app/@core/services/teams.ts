import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Service()
export class Teams {
  private readonly http = inject(HttpClient);
  private readonly api = environment.api;

  getAllTeams() {
    return this.http.get(`${this.api}/teams`);
  }

  createTeam(team: unknown) {
    return this.http.post(`${this.api}/teams`, team);
  }

  updateTeam(id: string | number, team: unknown) {
    return this.http.put(`${this.api}/teams/${id}`, team);
  }
}