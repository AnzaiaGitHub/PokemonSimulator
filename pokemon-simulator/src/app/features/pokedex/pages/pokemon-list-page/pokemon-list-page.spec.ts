import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokemonListPage } from './pokemon-list-page';

describe('PokemonListPage', () => {
  let component: PokemonListPage;
  let fixture: ComponentFixture<PokemonListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonListPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonListPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
