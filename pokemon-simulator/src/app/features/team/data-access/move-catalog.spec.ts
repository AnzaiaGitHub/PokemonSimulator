import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { LocalDb } from '../../../core/database';
import { LOCAL_DB_NAME } from '../../../core/database/local-db.provider';
import { NotFoundError } from '../../../core/errors/data-error';
import { Move } from '../../../core/models';
import { FakePokedexRepository } from '../../pokedex/data-access/testing/pokedex-fake.repository';
import { DataResult, POKEDEX_REPOSITORY } from '../../pokedex/data-access/pokedex.repository';
import { MoveCatalog, MoveLoadProgress } from './move-catalog';

function createMove(name: string): Move {
  return {
    id: 1,
    name,
    type: 'normal',
    damageClass: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    priority: 0,
    fetchedAt: 0,
  };
}

class FakeMoveRepository extends FakePokedexRepository {
  readonly calls: string[] = [];

  constructor(private readonly moveList: readonly Move[]) {
    super();
  }

  override getMove(name: string): Observable<DataResult<Move>> {
    this.calls.push(name);
    const move = this.moveList.find((entry) => entry.name === name);

    return move
      ? of({ data: move, source: 'cache' })
      : throwError(() => new NotFoundError(`Move not found: ${name}`));
  }
}

let databaseCounter = 0;

function setup(repository: FakeMoveRepository): { catalog: MoveCatalog; localDb: LocalDb } {
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCAL_DB_NAME, useValue: `move-catalog-test-${++databaseCounter}` },
      { provide: POKEDEX_REPOSITORY, useValue: repository },
    ],
  });

  return {
    catalog: TestBed.inject(MoveCatalog),
    localDb: TestBed.inject(LocalDb),
  };
}

describe('MoveCatalog', () => {
  it('loads unique move details and reports progress', async () => {
    const repository = new FakeMoveRepository([createMove('tackle'), createMove('growl')]);
    const { catalog } = setup(repository);
    const progress: MoveLoadProgress[] = [];

    const result = await catalog.loadMoves(['Tackle', 'tackle', 'growl'], (event) =>
      progress.push(event),
    );

    expect(repository.calls).toEqual(['tackle', 'growl']);
    expect(result.moves.map((move) => move.name)).toEqual(['tackle', 'growl']);
    expect(result.failed).toEqual([]);
    expect(progress.at(-1)).toEqual({ loaded: 2, failed: 0, total: 2 });
  });

  it('serves moves from the in-memory catalog after the first load', async () => {
    const repository = new FakeMoveRepository([createMove('tackle')]);
    const { catalog } = setup(repository);

    await catalog.loadMoves(['tackle']);
    await catalog.loadMoves(['tackle']);

    expect(repository.calls).toEqual(['tackle']);
  });

  it('reads cached moves without touching the network', async () => {
    const repository = new FakeMoveRepository([]);
    const { catalog, localDb } = setup(repository);
    await localDb.putMove(createMove('surf'));

    const moves = await catalog.getCachedMoves(['surf', 'missing']);

    expect(moves.map((move) => move.name)).toEqual(['surf']);
    expect(repository.calls).toEqual([]);
  });

  it('keeps loading the other moves when one fails', async () => {
    const repository = new FakeMoveRepository([createMove('tackle')]);
    const { catalog } = setup(repository);

    const result = await catalog.loadMoves(['tackle', 'missing']);

    expect(result.moves.map((move) => move.name)).toEqual(['tackle']);
    expect(result.failed).toEqual(['missing']);
  });

  it('returns no moves when the learnset is empty', async () => {
    const repository = new FakeMoveRepository([]);
    const { catalog } = setup(repository);

    const result = await catalog.loadMoves([]);

    expect(result).toEqual({ moves: [], failed: [] });
    expect(repository.calls).toEqual([]);
  });
});
