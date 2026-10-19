import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PokemonIndexEntry } from '../../../../core/models';
import {
  formatPokemonId,
  POKEMON_PLACEHOLDER_SPRITE,
  pokemonSpriteUrl,
} from '../../utils/pokemon-display';

@Component({
  selector: 'app-pokemon-card',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './pokemon-card.html',
  styleUrl: './pokemon-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonCard {
  readonly pokemon = input.required<PokemonIndexEntry>();

  private readonly imageFailed = signal(false);

  protected readonly displayId = computed(() => formatPokemonId(this.pokemon().id));

  protected readonly imageSrc = computed(() =>
    this.imageFailed() ? POKEMON_PLACEHOLDER_SPRITE : pokemonSpriteUrl(this.pokemon().id),
  );

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
