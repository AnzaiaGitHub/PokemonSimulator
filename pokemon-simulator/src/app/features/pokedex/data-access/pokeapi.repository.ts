import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { POKEAPI_BASE_URL } from '../../../core/config/pokeapi.config';
import {
  mapMoveResponse,
  mapPokemonIndexResponse,
  mapPokemonResponse,
  mapTypeResponse,
} from '../../../core/mappers';
import {
  Move,
  Pokemon,
  PokemonIndexEntry,
  PokemonType,
  PokemonListResponse,
  PokemonResponse,
  MoveResponse,
  TypeResponse,
} from '../../../core/models';
import { DataResult, PokedexRepository } from './pokedex.repository';

@Injectable()
export class PokeApiSource implements PokedexRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(POKEAPI_BASE_URL).replace(/\/+$/, '');

  getPokemonIndex(): Observable<DataResult<readonly PokemonIndexEntry[]>> {
    return this.http.get<PokemonListResponse>(`${this.endpoint('pokemon')}?limit=100000`).pipe(
      map((response) => ({
        data: mapPokemonIndexResponse(response),
        source: 'network' as const,
      })),
    );
  }

  getPokemon(nameOrId: string | number): Observable<DataResult<Pokemon>> {
    return this.http.get<PokemonResponse>(this.endpoint('pokemon', nameOrId)).pipe(
      map((response) => ({
        data: mapPokemonResponse(response, Date.now()),
        source: 'network' as const,
      })),
    );
  }

  getMove(name: string): Observable<DataResult<Move>> {
    return this.http.get<MoveResponse>(this.endpoint('move', name)).pipe(
      map((response) => ({
        data: mapMoveResponse(response, Date.now()),
        source: 'network' as const,
      })),
    );
  }

  getType(name: string): Observable<DataResult<PokemonType>> {
    return this.http.get<TypeResponse>(this.endpoint('type', name)).pipe(
      map((response) => ({
        data: mapTypeResponse(response),
        source: 'network' as const,
      })),
    );
  }

  private endpoint(...segments: readonly (string | number)[]): string {
    return [this.baseUrl, ...segments.map((segment) => encodeURIComponent(String(segment)))].join(
      '/',
    );
  }
}
