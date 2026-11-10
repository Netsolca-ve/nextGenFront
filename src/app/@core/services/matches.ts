import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  AdminMatch,
  MatchAlignment,
  MatchAlignmentCreate,
  MatchAlignmentUpdate,
  MatchGoal,
  MatchIncident,
  MatchSubstitution,
  MatchUpdateInput,
} from '../models/match.models';

@Service()
export class Matches {
  private readonly http = inject(HttpClient);
  private readonly api = environment.api;

  getAllMatches() {
    return this.http.get<AdminMatch[] | { data?: AdminMatch[] }>(`${this.api}/matches`).pipe(
      map((response) => (Array.isArray(response) ? response : (response.data ?? []))),
    );
  }

  getMatch(id: number) {
    return this.http.get<AdminMatch>(`${this.api}/matches/${id}`);
  }

  getAlignments(idPartido: number) {
    return this.http
      .get<MatchAlignment[] | { data?: MatchAlignment[] }>(`${this.api}/matches/${idPartido}/alineaciones`)
      .pipe(map((response) => (Array.isArray(response) ? response : (response.data ?? []))));
  }

  updateMatch(id: number, payload: MatchUpdateInput) {
    return this.http.put<{ message?: string }>(`${this.api}/matches/${id}`, payload);
  }

  deleteMatch(id: number) {
    return this.http.delete<{ idPartido?: number; message?: string }>(`${this.api}/matches/${id}`);
  }

  updateAlignments(id: number, payload: MatchAlignmentUpdate[]) {
    return this.http.put<{ message?: string }>(`${this.api}/matches/${id}/alineaciones`, payload);
  }

  createAlignment(id: number, payload: MatchAlignmentCreate) {
    return this.http.post<{ message?: string }>(`${this.api}/matches/${id}/alineaciones`, payload);
  }

  getGoals(idPartido: number) {
    return this.http.get<MatchGoal[] | { data?: MatchGoal[] }>(`${this.api}/matches/${idPartido}/goles`).pipe(
      map((response) => (Array.isArray(response) ? response : (response.data ?? []))),
    );
  }

  createGoal(idPartido: number, payload: MatchGoal) {
    return this.http.post<{ message?: string }>(`${this.api}/matches/${idPartido}/goles`, payload);
  }

  /** Tarjetas del partido. Si el backend aún no expone la ruta, devuelve []. */
  getCards(idPartido: number) {
    return this.http
      .get<MatchIncident[] | { data?: MatchIncident[] }>(`${this.api}/matches/${idPartido}/tarjetas`)
      .pipe(
        map((response) => (Array.isArray(response) ? response : (response.data ?? []))),
        catchError(() => of<MatchIncident[]>([])),
      );
  }

  getSubstitutions(idPartido: number) {
    return this.http.get<MatchSubstitution[] | { data?: MatchSubstitution[] }>(`${this.api}/matches/${idPartido}/sustituciones`).pipe(
      map((response) => (Array.isArray(response) ? response : (response.data ?? []))),
    );
  }

  createSubstitution(idPartido: number, payload: MatchSubstitution) {
    return this.http.post<{ message?: string }>(`${this.api}/matches/${idPartido}/sustituciones`, payload);
  }
}
