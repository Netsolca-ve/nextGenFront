import { Routes } from '@angular/router';
import { authGuard } from './@core/guards/auth.guard';
import { PublicLayout } from './layouts/public-layout/public-layout';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión | Next Gen',
    data: { noindex: true },
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Crear cuenta | Next Gen',
    data: { noindex: true },
    loadComponent: () => import('./auth/register/register').then((m) => m.Register),
  },
  {
    path: 'admin',
    title: 'Panel de administración | Next Gen',
    // Lazy: el panel no debe pesar en el bundle inicial del sitio público
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
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
        title: 'Torneos | Administración Next Gen',
        loadComponent: () =>
          import('./features/admin/tournaments/admin-tournaments').then((m) => m.AdminTournaments),
      },
      {
        path: 'partidos',
        title: 'Partidos | Administración Next Gen',
        loadComponent: () =>
          import('./features/admin/matches/admin-matches').then((m) => m.AdminMatches),
      },
      {
        path: 'equipos',
        title: 'Equipos | Administración Next Gen',
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
        title: 'Next Gen Venezuela | Torneos de futsal y academias',
        data: {
          description:
            'Next Gen Venezuela: torneos de futsal, academias deportivas, partidos en vivo, resultados y estadísticas para atletas, clubes y organizaciones.',
        },
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
      },
      {
        path: 'about-us',
        title: 'Qué es Next Gen | Next Gen Venezuela',
        data: {
          description:
            'Next Gen Sport Ecosystem centraliza los servicios y herramientas que atletas, clubes y organizaciones necesitan para profesionalizar su gestión y proyectar su talento.',
        },
        loadComponent: () => import('./features/public/about-us/about-us').then((m) => m.AboutUs),
      },
      {
        // URL anterior que Google todavía tiene indexada
        path: 'about',
        redirectTo: 'about-us',
        pathMatch: 'full',
      },
      {
        path: 'academies',
        title: 'Academias de futsal y fútbol | Next Gen Venezuela',
        data: {
          description:
            'Conoce las academias de Next Gen en Venezuela: formación integral por etapas, desarrollo técnico y competencia para atletas en formación.',
        },
        loadComponent: () =>
          import('./features/public/academies/academies').then((m) => m.Academies),
      },
      {
        path: 'academies/almirantes',
        title: 'Academia Almirantes de futsal | Next Gen Venezuela',
        data: {
          description:
            'Academia Almirantes de Next Gen: formación basada en el modelo noruego, desarrollo integral por etapas y máxima participación.',
        },
        loadComponent: () =>
          import('./features/public/academies/almirantes/almirantes').then((m) => m.Almirantes),
      },
      {
        path: 'events',
        title: 'Torneos de futsal y eventos | Next Gen Venezuela',
        data: {
          description:
            'Calendario de torneos de futsal y eventos deportivos de Next Gen en Venezuela: fechas, sedes, equipos, posiciones y resultados.',
        },
        loadComponent: () => import('./features/public/events/events').then((m) => m.Events),
      },
      {
        path: 'events/:id',
        title: 'Torneo de futsal | Next Gen Venezuela',
        data: {
          description:
            'Detalle del evento: partidos, calendario, posiciones y equipos participantes del torneo Next Gen.',
        },
        loadComponent: () =>
          import('./features/public/events/components/event/event').then((m) => m.Event),
      },
      {
        path: 'match/:slug',
        title: 'Partido de futsal | Next Gen Venezuela',
        data: {
          description:
            'Resultado, alineaciones, goles y sustituciones del partido en el torneo de futsal Next Gen.',
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
