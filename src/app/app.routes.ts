import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';

export const routes: Routes = [
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
        path: 'match',
        loadComponent: () => import('./features/public/match/match').then((m) => m.Match),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
