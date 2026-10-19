import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { POKEDEX_REPOSITORY } from '../../data-access/pokedex.repository';
import { FakePokedexRepository } from '../../data-access/testing/pokedex-fake.repository';
import { PokemonListPage } from './pokemon-list-page';

async function createFixture(
  repository: FakePokedexRepository = new FakePokedexRepository(),
): Promise<ComponentFixture<PokemonListPage>> {
  await TestBed.configureTestingModule({
    imports: [PokemonListPage],
    providers: [{ provide: POKEDEX_REPOSITORY, useValue: repository }, provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(PokemonListPage);
  fixture.detectChanges();
  await fixture.whenStable();

  return fixture;
}

describe('PokemonListPage', () => {
  it('renders the first page of the index', async () => {
    const fixture = await createFixture();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('app-pokemon-card')).toHaveLength(20);
    expect(compiled.textContent).toContain('24 Pokémon found');
  });

  it('shows the empty state when there are no results', async () => {
    const fixture = await createFixture(new FakePokedexRepository([], []));
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No Pokémon match your search.');
    expect(compiled.textContent).toContain('Clear search');
  });
});
