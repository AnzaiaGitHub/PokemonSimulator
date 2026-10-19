import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, map, of, throwError } from 'rxjs';
import { NotFoundError } from '../../../core/errors/data-error';
import { Pokemon } from '../../../core/models';
import { POKEDEX_REPOSITORY } from './pokedex.repository';

export const pokemonDetailResolver: ResolveFn<Pokemon> = (route) => {
  const repository = inject(POKEDEX_REPOSITORY);
  const router = inject(Router);
  const name = route.paramMap.get('name') ?? '';

  return repository.getPokemon(name).pipe(
    map(({ data }) => data),
    catchError((error: unknown) => {
      if (error instanceof NotFoundError) {
        return of(new RedirectCommand(router.parseUrl('/not-found')));
      }

      return throwError(() => error);
    }),
  );
};
