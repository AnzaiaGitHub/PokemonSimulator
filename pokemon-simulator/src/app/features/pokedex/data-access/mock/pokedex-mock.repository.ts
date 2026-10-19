import { inject, Injectable } from '@angular/core';
import { map, mergeMap, Observable, timer } from 'rxjs';
import { NetworkError, NotFoundError } from '../../../../core/errors/data-error';
import { Move, Pokemon, PokemonIndexEntry, PokemonType } from '../../../../core/models';
import { DataResult, PokedexRepository } from '../pokedex.repository';
import { POKEDEX_MOCK_CONFIG } from './pokedex-mock.config';
import { POKEDEX_FIXTURES } from './pokedex-fixtures';

@Injectable()
export class InMemoryPokedexRepository implements PokedexRepository {
  private readonly config = inject(POKEDEX_MOCK_CONFIG);
  private readonly index: readonly PokemonIndexEntry[] = POKEDEX_FIXTURES.map(({ id, name }) => ({
    id,
    name,
  }));

  getPokemonIndex(): Observable<DataResult<readonly PokemonIndexEntry[]>> {
    return this.respond(this.index);
  }

  getPokemon(nameOrId: string | number): Observable<DataResult<Pokemon>> {
    const key = String(nameOrId).toLowerCase();
    const pokemon = POKEDEX_FIXTURES.find(
      (entry) => entry.name === key || String(entry.id) === key,
    );

    if (!pokemon) {
      return this.delayedError(new NotFoundError(`Pokémon not found: ${nameOrId}`));
    }

    return this.respond(pokemon);
  }

  getMove(): Observable<DataResult<Move>> {
    return this.delayedError(new NotFoundError('Move not found in the mock repository'));
  }

  getType(): Observable<DataResult<PokemonType>> {
    return this.delayedError(new NotFoundError('Type not found in the mock repository'));
  }

  private respond<T>(data: T): Observable<DataResult<T>> {
    if (this.config.fail) {
      return this.delayedError(new NetworkError('Could not load the Pokédex'));
    }

    return timer(this.config.delayMs).pipe(map(() => ({ data, source: 'cache' as const })));
  }

  private delayedError<T>(error: Error): Observable<T> {
    return timer(this.config.delayMs).pipe(
      mergeMap(() => {
        throw error;
      }),
    );
  }
}
