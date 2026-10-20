import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pokemon } from '../../../../core/models';
import { PokemonTypeBadge } from '../../../../shared/ui/pokemon-type-badge/pokemon-type-badge';
import { SpriteService } from '../../data-access/sprite';
import { PokemonStatsComponent } from '../../ui/pokemon-stats/pokemon-stats';
import { AddToTeamButton } from '../../../team/ui/add-to-team-button/add-to-team-button';
import {
  formatPokemonId,
  POKEMON_PLACEHOLDER_SPRITE,
  pokemonArtworkUrl,
} from '../../utils/pokemon-display';

@Component({
  selector: 'app-pokemon-detail-page',
  imports: [RouterLink, PokemonTypeBadge, PokemonStatsComponent, AddToTeamButton],
  templateUrl: './pokemon-detail-page.html',
  styleUrl: './pokemon-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailPage {
  private readonly sprites = inject(SpriteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pokemon = input.required<Pokemon>();

  private readonly loaded = signal<{ readonly id: number; readonly url: string } | null>(null);
  private readonly failedId = signal<number | null>(null);
  private currentId: number | null = null;

  protected readonly displayId = computed(() => formatPokemonId(this.pokemon().id));

  protected readonly imageSrc = computed(() => {
    const id = this.pokemon().id;

    if (this.failedId() === id) {
      return POKEMON_PLACEHOLDER_SPRITE;
    }

    const loaded = this.loaded();

    return loaded?.id === id ? loaded.url : POKEMON_PLACEHOLDER_SPRITE;
  });

  constructor() {
    effect(() => {
      const pokemon = this.pokemon();

      if (this.currentId !== null && this.currentId !== pokemon.id) {
        this.sprites.release(this.currentId);
      }

      this.currentId = pokemon.id;
      void this.loadSprite(pokemon);
    });

    this.destroyRef.onDestroy(() => {
      if (this.currentId !== null) {
        this.sprites.release(this.currentId);
      }
    });
  }

  protected onImageError(): void {
    this.failedId.set(this.pokemon().id);
  }

  private async loadSprite(pokemon: Pokemon): Promise<void> {
    try {
      const remoteUrl = pokemon.spriteUrl ?? pokemonArtworkUrl(pokemon.id);
      const url = await this.sprites.load(pokemon.id, remoteUrl);

      if (this.currentId === pokemon.id) {
        this.loaded.set({ id: pokemon.id, url });
      }
    } catch {
      if (this.currentId === pokemon.id) {
        this.failedId.set(pokemon.id);
      }
    }
  }
}
