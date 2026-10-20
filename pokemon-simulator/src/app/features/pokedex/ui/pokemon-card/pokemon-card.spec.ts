import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { POKEDEX_REPOSITORY } from '../../data-access/pokedex.repository';
import { SpriteService } from '../../data-access/sprite';
import { TeamStore } from '../../../team/stores/team.store';
import { PokemonCard } from './pokemon-card';

describe('PokemonCard', () => {
  let fixture: ComponentFixture<PokemonCard>;
  const sprites = {
    load: vi.fn(() => Promise.resolve('blob:sprite')),
    release: vi.fn(),
  };
  const teamStore = {
    isFull: vi.fn(() => false),
    isReady: vi.fn(() => true),
    hasPokemon: vi.fn(() => false),
    addPokemon: vi.fn(() => ({ ok: true, index: 0 })),
    status: vi.fn(() => 'ready'),
  };
  const pokedexRepository = {
    getPokemon: vi.fn(() => ({
      pipe: () => ({ subscribe: () => {} }),
    })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonCard],
      providers: [
        provideRouter([]),
        { provide: SpriteService, useValue: sprites },
        { provide: TeamStore, useValue: teamStore },
        { provide: POKEDEX_REPOSITORY, useValue: pokedexRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonCard);
  });

  it('renders the formatted id, name and detail link', () => {
    fixture.componentRef.setInput('pokemon', { id: 13, name: 'pikachu' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('#0013');
    expect(compiled.textContent).toContain('pikachu');
    expect(compiled.querySelector('a')?.getAttribute('href')).toBe('/pokemon/pikachu');
  });

  it('loads the sprite through the local sprite service', async () => {
    fixture.componentRef.setInput('pokemon', { id: 13, name: 'pikachu' });
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(sprites.load).toHaveBeenCalledWith(
      13,
      expect.stringContaining('/sprites/pokemon/13.png'),
    );
    expect(image.getAttribute('src')).toBe('blob:sprite');
  });

  it('renders the add to team button', () => {
    fixture.componentRef.setInput('pokemon', { id: 13, name: 'pikachu' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('app-add-to-team-button');

    expect(button).not.toBeNull();
  });
});