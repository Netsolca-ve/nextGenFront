import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { tap } from 'rxjs/internal/operators/tap';

@Service()
export class Tournaments {
    private http = inject(HttpClient);
    private api: string = environment.api;  

    getAllTournaments() {
        return this.http.get(`${this.api}/tournaments`).pipe(
            tap((response: any) => {
                console.log('All tournaments response:', response);
            })
        )
    }

    getNearestTournament() {
        return this.http.get(`${this.api}/tournaments/nearest`);
    }

    createTournament(tournament: any) {
        return this.http.post(`${this.api}/tournaments`, tournament);
    }
}
