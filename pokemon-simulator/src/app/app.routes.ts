import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout').then((m) => m.MainLayout),
    loadChildren: () =>
      import('./core/layout/main-layout/main-layuout.routes').then((m) => m.MAIN_LAYOUT_ROUTES),
  },
];
