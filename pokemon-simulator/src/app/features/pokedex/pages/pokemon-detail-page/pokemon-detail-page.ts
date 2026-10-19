import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pokemon } from '../../../../core/models';
import { PokemonTypeBadge } from '../../../../shared/ui/pokemon-type-badge/pokemon-type-badge';
import { PokemonStatsComponent } from '../../ui/pokemon-stats/pokemon-stats';
import {
  formatPokemonId,
  POKEMON_PLACEHOLDER_SPRITE,
  pokemonArtworkUrl,
} from '../../utils/pokemon-display';

@Component({
  selector: 'app-pokemon-detail-page',
  imports: [NgOptimizedImage, RouterLink, PokemonTypeBadge, PokemonStatsComponent],
  templateUrl: './pokemon-detail-page.html',
  styleUrl: './pokemon-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailPage {
  readonly pokemon = input.required<Pokemon>();

  private readonly imageFailed = signal(false);

  protected readonly displayId = computed(() => formatPokemonId(this.pokemon().id));

  protected readonly imageSrc = computed(() =>
    this.imageFailed() ? POKEMON_PLACEHOLDER_SPRITE : pokemonArtworkUrl(this.pokemon().id),
  );

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
