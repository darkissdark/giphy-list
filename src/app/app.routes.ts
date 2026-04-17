import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'gif/:id',
    loadComponent: () =>
      import('./pages/gif-detail/gif-detail-page.component').then((m) => m.GifDetailPageComponent),
  },
  { path: '**', redirectTo: '' },
];
