import { Observable, of, throwError } from 'rxjs';
import { NotFoundError } from '../../../../core/errors/data-error';
import { Move, Pokemon, PokemonIndexEntry, PokemonType } from '../../../../core/models';
import { POKEDEX_FIXTURES } from '../mock/pokedex-fixtures';
import { DataResult, PokedexRepository } from '../pokedex.repository';

const DEFAULT_INDEX: readonly PokemonIndexEntry[] = POKEDEX_FIXTURES.map(({ id, name }) => ({
  id,
  name,
}));

export class FakePokedexRepository implements PokedexRepository {
  constructor(
    private readonly index: readonly PokemonIndexEntry[] = DEFAULT_INDEX,
    private readonly details: readonly Pokemon[] = POKEDEX_FIXTURES,
    private readonly types: readonly PokemonType[] = [],
  ) {}

  getPokemonIndex(): Observable<DataResult<readonly PokemonIndexEntry[]>> {
    return of({ data: this.index, source: 'cache' });
  }

  getPokemon(nameOrId: string | number): Observable<DataResult<Pokemon>> {
    const key = String(nameOrId).toLowerCase();
    const pokemon = this.details.find((entry) => entry.name === key || String(entry.id) === key);

    if (!pokemon) {
      return throwError(() => new NotFoundError(`Pokémon not found: ${nameOrId}`));
    }

    return of({ data: pokemon, source: 'cache' });
  }

  getMove(name: string): Observable<DataResult<Move>> {
    return throwError(() => new NotFoundError(`Move not found: ${name}`));
  }

  getType(name: string): Observable<DataResult<PokemonType>> {
    const type = this.types.find((entry) => entry.name === name);

    if (!type) {
      return throwError(() => new NotFoundError('Type not found'));
    }

    return of({ data: type, source: 'cache' });
  }
}
