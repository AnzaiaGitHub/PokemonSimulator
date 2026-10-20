import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { POKEDEX_FIXTURES } from '../../data-access/mock/pokedex-fixtures';
import { SpriteService } from '../../data-access/sprite';
import { TeamStore } from '../../../team/stores/team.store';
import { POKEDEX_REPOSITORY } from '../../data-access/pokedex.repository';
import { PokemonDetailPage } from './pokemon-detail-page';

const PIKACHU = POKEDEX_FIXTURES[12];

describe('PokemonDetailPage', () => {
  let fixture: ComponentFixture<PokemonDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: SpriteService,
          useValue: { load: () => Promise.resolve('blob:sprite'), release: () => undefined },
        },
        {
          provide: TeamStore,
          useValue: {
            isFull: () => false,
            isReady: () => true,
            hasPokemon: () => false,
            addPokemon: () => ({ ok: true, index: 0 }),
            status: () => 'ready',
          },
        },
        {
          provide: POKEDEX_REPOSITORY,
          useValue: { getPokemon: () => ({ pipe: () => ({ subscribe: () => {} }) }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonDetailPage);
    fixture.componentRef.setInput('pokemon', PIKACHU);
    fixture.detectChanges();
  });

  it('renders the Pokémon identity, measurements and types', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('#0013');
    expect(compiled.textContent).toContain('pikachu');
    expect(compiled.textContent).toContain('0.4 m');
    expect(compiled.textContent).toContain('6 kg');
    expect(compiled.textContent).toContain('electric');
  });

  it('links back to the Pokédex', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/pokedex');
  });

  it('renders the add to team button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('app-add-to-team-button');

    expect(button).not.toBeNull();
  });
});