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
import { PokemonIndexEntry } from '../../../../core/models';
import { SpriteService } from '../../data-access/sprite';
import {
  formatPokemonId,
  POKEMON_PLACEHOLDER_SPRITE,
  pokemonSpriteUrl,
} from '../../utils/pokemon-display';

@Component({
  selector: 'app-pokemon-card',
  imports: [RouterLink],
  templateUrl: './pokemon-card.html',
  styleUrl: './pokemon-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonCard {
  private readonly sprites = inject(SpriteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pokemon = input.required<PokemonIndexEntry>();

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
      const id = this.pokemon().id;

      if (this.currentId !== null && this.currentId !== id) {
        this.sprites.release(this.currentId);
      }

      this.currentId = id;
      void this.loadSprite(id);
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

  private async loadSprite(id: number): Promise<void> {
    try {
      const url = await this.sprites.load(id, pokemonSpriteUrl(id));

      if (this.currentId === id) {
        this.loaded.set({ id, url });
      }
    } catch {
      if (this.currentId === id) {
        this.failedId.set(id);
      }
    }
  }
}
