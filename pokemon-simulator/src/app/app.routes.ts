import { Routes } from '@angular/router';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { MAIN_LAYOUT_ROUTES } from './core/layout/main-layout/main-layuout.routes';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: MAIN_LAYOUT_ROUTES,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
