import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { map } from 'rxjs';
import { AdminTournament, TournamentInput, TournamentMatch, TournamentStanding } from '../models/tournament.models';

@Service()
export class Tournaments {
    private http = inject(HttpClient);
    private api: string = environment.api;

    getAllTournaments() {
        return this.http.get<AdminTournament[] | { data?: AdminTournament[] }>(`${this.api}/tournaments`).pipe(
            map((response) => Array.isArray(response) ? response : (response.data ?? [])),
        );
    }

    getNearestTournament() {
        return this.http.get(`${this.api}/tournaments/nearest`);
    }

    getTournament(id: string | number) {
        return this.http.get<AdminTournament>(`${this.api}/tournaments/${id}`);
    }

    getTournamentMatches(id: string | number) {
        return this.http.get<TournamentMatch[]>(`${this.api}/tournaments/${id}/partidos`);
    }

    getTournamentStandings(id: string | number) {
        return this.http.get<TournamentStanding[]>(`${this.api}/tournaments/${id}/posiciones`);
    }

    /** Equipos inscritos en un torneo (para precargar la edición). */
    getTournamentTeams(id: string | number) {
        return this.http.get<Array<{ idEquipo: number; nombre?: string; siglas?: string; categoria?: string }>>(
            `${this.api}/tournaments/${id}/equipos`,
        );
    }

    createTournament(tournament: TournamentInput) {
        return this.http.post(`${this.api}/tournaments`, tournament);
    }

    updateTournament(id: string | number, tournament: TournamentInput) {
        return this.http.put(`${this.api}/tournaments/${id}`, tournament);
    }

    /** Elimina el torneo con todos sus partidos e inscripciones. */
    deleteTournament(id: string | number) {
        return this.http.delete<{ idTorneo?: number; message?: string }>(`${this.api}/tournaments/${id}`);
    }
}
