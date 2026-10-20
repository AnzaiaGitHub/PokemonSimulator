import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SpriteService } from '../../data-access/sprite';
import { PokemonCard } from './pokemon-card';

describe('PokemonCard', () => {
  let fixture: ComponentFixture<PokemonCard>;
  const sprites = {
    load: vi.fn(() => Promise.resolve('blob:sprite')),
    release: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonCard],
      providers: [provideRouter([]), { provide: SpriteService, useValue: sprites }],
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
});
