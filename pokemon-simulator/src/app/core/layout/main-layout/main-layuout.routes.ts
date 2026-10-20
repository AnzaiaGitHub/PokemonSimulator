import { Routes } from '@angular/router';
import { pokemonDetailResolver } from '../../../features/pokedex/data-access/pokemon-detail.resolver';

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
    path: 'pokemon/:name',
    loadComponent: () =>
      import('../../../features/pokedex/pages/pokemon-detail-page/pokemon-detail-page').then(
        (m) => m.PokemonDetailPage,
      ),
    resolve: {
      pokemon: pokemonDetailResolver,
    },
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
      import('../../../features/battles/pages/battle-arena/battle-arena').then(
        (m) => m.BattleArena,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('../../../features/settings/pages/settings-page/settings-page').then(
        (m) => m.SettingsPage,
      ),
  },
  {
    path: 'not-found',
    loadComponent: () => import('../../pages/not-found/not-found').then((m) => m.NotFound),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
