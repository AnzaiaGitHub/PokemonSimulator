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
import { Pokemon } from '../../../../core/models';
import { PokemonTypeBadge } from '../../../../shared/ui/pokemon-type-badge/pokemon-type-badge';
import { SpriteService } from '../../../pokedex/data-access/sprite';
import {
  POKEMON_PLACEHOLDER_SPRITE,
  pokemonArtworkUrl,
} from '../../../pokedex/utils/pokemon-display';
import { BattleFighter } from '../../engine';
import { formatIdentifier } from '../../utils/battle-format';

@Component({
  selector: 'app-battle-fighter-panel',
  imports: [PokemonTypeBadge],
  templateUrl: './battle-fighter-panel.html',
  styleUrl: './battle-fighter-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFighterPanel {
  private readonly sprites = inject(SpriteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly fighter = input.required<BattleFighter>();
  readonly label = input.required<string>();
  readonly isWinner = input(false);

  private readonly loaded = signal<{ readonly id: number; readonly url: string } | null>(null);
  private readonly failedId = signal<number | null>(null);
  private currentId: number | null = null;

  protected readonly name = computed(() => formatIdentifier(this.fighter().pokemon.name));
  protected readonly hpPercent = computed(() => {
    const fighter = this.fighter();

    return fighter.maxHp === 0
      ? 0
      : Math.max(0, Math.min(100, Math.round((fighter.currentHp / fighter.maxHp) * 100)));
  });
  protected readonly isFainted = computed(() => this.fighter().currentHp === 0);
  protected readonly hpBarClasses = computed(() => {
    const percent = this.hpPercent();

    if (percent > 50) {
      return 'h-full rounded-full bg-emerald-500 transition-all';
    }

    if (percent > 20) {
      return 'h-full rounded-full bg-amber-400 transition-all';
    }

    return 'h-full rounded-full bg-red-500 transition-all';
  });
  protected readonly imageSrc = computed(() => {
    const id = this.fighter().pokemon.id;

    if (this.failedId() === id) {
      return POKEMON_PLACEHOLDER_SPRITE;
    }

    const loaded = this.loaded();

    return loaded?.id === id ? loaded.url : POKEMON_PLACEHOLDER_SPRITE;
  });

  constructor() {
    effect(() => {
      const pokemon = this.fighter().pokemon;

      if (this.currentId === pokemon.id) {
        return;
      }

      if (this.currentId !== null) {
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
    this.failedId.set(this.fighter().pokemon.id);
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
