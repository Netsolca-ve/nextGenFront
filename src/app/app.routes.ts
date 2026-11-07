import { Routes } from '@angular/router';
import { authGuard } from './@core/guards/auth.guard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { PublicLayout } from './layouts/public-layout/public-layout';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión | NextGen',
    data: { noindex: true },
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Crear cuenta | NextGen',
    data: { noindex: true },
    loadComponent: () => import('./auth/register/register').then((m) => m.Register),
  },
  {
    path: 'admin',
    title: 'Panel de administración | NextGen',
    component: AdminLayout,
    canActivate: [authGuard],
    data: { noindex: true },
    children: [
      {
        path: '',
        redirectTo: 'torneos',
        pathMatch: 'full',
      },
      {
        path: 'torneos',
        title: 'Torneos | Administración NextGen',
        loadComponent: () =>
          import('./features/admin/tournaments/admin-tournaments').then((m) => m.AdminTournaments),
      },
      {
        path: 'partidos',
        title: 'Partidos | Administración NextGen',
        loadComponent: () =>
          import('./features/admin/matches/admin-matches').then((m) => m.AdminMatches),
      },
      {
        path: 'equipos',
        title: 'Equipos | Administración NextGen',
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
        title: 'NextGen | Formación y gestión deportiva',
        data: {
          description:
            'Plataforma integral de formación, gestión y competencia deportiva: academias, torneos, partidos y estadísticas para atletas, clubes y organizaciones.',
        },
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
      },
      {
        path: 'about-us',
        title: 'Qué es NextGen | Formación y gestión deportiva',
        data: {
          description:
            'NextGen centraliza los servicios y herramientas que atletas, clubes y organizaciones necesitan para profesionalizar su gestión y proyectar su talento.',
        },
        loadComponent: () => import('./features/public/about-us/about-us').then((m) => m.AboutUs),
      },
      {
        path: 'academies',
        title: 'Academias deportivas | NextGen',
        data: {
          description:
            'Conoce las academias de NextGen: formación integral por etapas, desarrollo técnico y competencia para atletas en formación.',
        },
        loadComponent: () =>
          import('./features/public/academies/academies').then((m) => m.Academies),
      },
      {
        path: 'academies/almirantes',
        title: 'Academia Almirantes | NextGen',
        data: {
          description:
            'Academia Almirantes de NextGen: formación basada en el modelo noruego, desarrollo integral por etapas y máxima participación.',
        },
        loadComponent: () =>
          import('./features/public/academies/almirantes/almirantes').then((m) => m.Almirantes),
      },
      {
        path: 'events',
        title: 'Eventos y torneos | NextGen',
        data: {
          description:
            'Calendario de torneos y eventos deportivos de NextGen: fechas, sedes, equipos participantes y resultados.',
        },
        loadComponent: () => import('./features/public/events/events').then((m) => m.Events),
      },
      {
        path: 'events/:id',
        title: 'Evento | NextGen',
        data: {
          description:
            'Detalle del evento: partidos, calendario, posiciones y equipos participantes del torneo NextGen.',
        },
        loadComponent: () =>
          import('./features/public/events/components/event/event').then((m) => m.Event),
      },
      {
        path: 'match/:slug',
        title: 'Partido | NextGen',
        data: {
          description:
            'Resultado, alineaciones, goles y sustituciones del partido en el torneo NextGen.',
        },
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
