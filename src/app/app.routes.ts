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
                loadComponent: () => import('./features/public/academies/academies').then((m) => m.Academies),
            },
            {
                path: 'academies/almirantes',
                loadComponent: () =>
                    import('./features/public/academies/almirantes/almirantes').then((m) => m.Almirantes),
            },
            {
                path: '**',
                redirectTo: '',
            },
        ]
    }
];
