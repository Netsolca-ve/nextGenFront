import { Routes } from '@angular/router';
import { authGuard } from './@core/guards/auth.guard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { PublicLayout } from './layouts/public-layout/public-layout';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then((m) => m.Register),
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'torneos',
        pathMatch: 'full',
      },
      {
        path: 'torneos',
        loadComponent: () =>
          import('./features/admin/tournaments/admin-tournaments').then((m) => m.AdminTournaments),
      },
      {
        path: 'partidos',
        loadComponent: () =>
          import('./features/admin/matches/admin-matches').then((m) => m.AdminMatches),
      },
      {
        path: 'equipos',
        loadComponent: () => import('./features/admin/teams/admin-teams').then((m) => m.AdminTeams),
      },
      {
        path: '**',
        redirectTo: 'torneos',
      },
    ],
  },
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
      },
      {
        path: 'about-us',
        loadComponent: () => import('./features/public/about-us/about-us').then((m) => m.AboutUs),
      },
      {
        path: 'academies',
        loadComponent: () =>
          import('./features/public/academies/academies').then((m) => m.Academies),
      },
      {
        path: 'academies/almirantes',
        loadComponent: () =>
          import('./features/public/academies/almirantes/almirantes').then((m) => m.Almirantes),
      },
      {
        path: 'events',
        loadComponent: () => import('./features/public/events/events').then((m) => m.Events),
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./features/public/events/components/event/event').then((m) => m.Event),
      },
      {
        path: 'match/:slug',
        loadComponent: () => import('./features/public/match/match').then((m) => m.Match),
      },
      {
        path: 'match',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
