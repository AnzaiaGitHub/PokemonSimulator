import { Routes } from '@angular/router';

export const MAIN_LAYOUT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'pokedex',
    pathMatch: 'full',
  },
  {
    path: 'pokedex',
    loadComponent: () =>
      import('../../../features/pokedex/pages/pokemon-list-page/pokemon-list-page').then(
        (m) => m.PokemonListPage,
      ),
  },
  {
    path: 'team',
    loadComponent: () =>
      import('../../../features/team/pages/team-management/team-management').then(
        (m) => m.TeamManagement,
      ),
  },
  {
    path: 'battle',
    loadComponent: () =>
      import('../../../features/battles/pages/battle-arena/battle-arena').then((m) => m.BattleArena),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('../../pages/not-found/not-found').then((m) => m.NotFound),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
