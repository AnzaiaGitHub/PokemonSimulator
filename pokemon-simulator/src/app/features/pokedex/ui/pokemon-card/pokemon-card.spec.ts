import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PokemonCard } from './pokemon-card';

describe('PokemonCard', () => {
  let fixture: ComponentFixture<PokemonCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonCard],
      providers: [provideRouter([])],
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

  it('uses the remote sprite URL', () => {
    fixture.componentRef.setInput('pokemon', { id: 13, name: 'pikachu' });
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(image.getAttribute('src')).toContain('/sprites/pokemon/13.png');
  });
});
