import { Routes } from '@angular/router';
import { GifDetailPageComponent } from './pages/gif-detail/gif-detail-page.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'gif/:id', component: GifDetailPageComponent },
  { path: '**', redirectTo: '' },
];
