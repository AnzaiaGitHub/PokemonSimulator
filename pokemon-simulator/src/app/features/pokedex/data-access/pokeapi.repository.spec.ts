import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { POKEAPI_BASE_URL } from '../../../core/config/pokeapi.config';
import { NotFoundError, RateLimitError } from '../../../core/errors/data-error';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import {
  createMoveResponse,
  createPokemonResponse,
  createTypeResponse,
} from '../../../core/mappers/testing/pokeapi-fixtures';
import { PokeApiSource } from './pokeapi.repository';

const BASE_URL = 'https://pokeapi.co/api/v2';

describe('PokeApiSource', () => {
  let source: PokeApiSource;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: POKEAPI_BASE_URL, useValue: BASE_URL },
        PokeApiSource,
      ],
    });

    source = TestBed.inject(PokeApiSource);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('downloads and maps the complete Pokémon index', async () => {
    const request = firstValueFrom(source.getPokemonIndex());
    const httpRequest = controller.expectOne(`${BASE_URL}/pokemon?limit=100000`);

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({
      count: 2,
      next: null,
      previous: null,
      results: [
        { name: 'bulbasaur', url: `${BASE_URL}/pokemon/1/` },
        { name: 'ivysaur', url: `${BASE_URL}/pokemon/2/` },
      ],
    });

    const result = await request;

    expect(result.source).toBe('network');
    expect(result.data).toEqual([
      { id: 1, name: 'bulbasaur' },
      { id: 2, name: 'ivysaur' },
    ]);
  });

  it('maps a Pokémon detail response', async () => {
    const request = firstValueFrom(source.getPokemon('pikachu'));
    controller.expectOne(`${BASE_URL}/pokemon/pikachu`).flush(createPokemonResponse());

    const result = await request;

    expect(result.source).toBe('network');
    expect(result.data.name).toBe('pikachu');
    expect(result.data.types).toEqual(['electric']);
    expect(result.data.fetchedAt).toBeGreaterThan(0);
  });

  it('accepts numeric ids and encodes names in the URL', async () => {
    const byId = firstValueFrom(source.getPokemon(25));
    controller.expectOne(`${BASE_URL}/pokemon/25`).flush(createPokemonResponse());

    const byName = firstValueFrom(source.getMove('thunder bolt'));
    controller.expectOne(`${BASE_URL}/move/thunder%20bolt`).flush(createMoveResponse());

    await byId;
    await byName;
  });

  it('maps move and type responses', async () => {
    const moveRequest = firstValueFrom(source.getMove('thunderbolt'));
    controller.expectOne(`${BASE_URL}/move/thunderbolt`).flush(createMoveResponse());

    const typeRequest = firstValueFrom(source.getType('electric'));
    controller.expectOne(`${BASE_URL}/type/electric`).flush(createTypeResponse());

    const move = await moveRequest;
    const type = await typeRequest;

    expect(move.data.name).toBe('thunderbolt');
    expect(move.data.damageClass).toBe('special');
    expect(type.data.name).toBe('electric');
    expect(type.data.damageRelations.doubleDamageFrom).toEqual(['ground']);
  });

  it('translates HTTP errors through the interceptor', async () => {
    const notFound = firstValueFrom(source.getPokemon('missingno'));
    controller
      .expectOne(`${BASE_URL}/pokemon/missingno`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    const rateLimited = firstValueFrom(source.getPokemonIndex());
    controller
      .expectOne(`${BASE_URL}/pokemon?limit=100000`)
      .flush(null, { status: 429, statusText: 'Too Many Requests' });

    await expect(notFound).rejects.toBeInstanceOf(NotFoundError);
    await expect(rateLimited).rejects.toBeInstanceOf(RateLimitError);
  });
});
