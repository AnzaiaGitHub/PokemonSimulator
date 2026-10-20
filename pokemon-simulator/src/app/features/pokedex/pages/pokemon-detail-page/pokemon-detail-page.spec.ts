import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { POKEDEX_FIXTURES } from '../../data-access/mock/pokedex-fixtures';
import { SpriteService } from '../../data-access/sprite';
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
});
