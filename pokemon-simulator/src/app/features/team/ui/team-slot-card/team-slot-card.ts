import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pokemon, TeamSlot } from '../../../../core/models';
import { PokemonTypeBadge } from '../../../../shared/ui/pokemon-type-badge/pokemon-type-badge';
import { SpriteService } from '../../../pokedex/data-access/sprite';
import { POKEMON_PLACEHOLDER_SPRITE, pokemonArtworkUrl } from '../../../pokedex/utils/pokemon-display';

@Component({
  selector: 'app-team-slot-card',
  imports: [RouterLink, PokemonTypeBadge],
  templateUrl: './team-slot-card.html',
  styleUrl: './team-slot-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSlotCard {
  private readonly sprites = inject(SpriteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly slot = input.required<TeamSlot | null>();
  readonly index = input.required<number>();
  readonly canMoveUp = input(false);
  readonly canMoveDown = input(false);

  readonly remove = output<number>();
  readonly moveUp = output<number>();
  readonly moveDown = output<number>();

  private readonly loaded = signal<{ readonly id: number; readonly url: string } | null>(null);
  private readonly failedId = signal<number | null>(null);
  private currentId: number | null = null;

  protected readonly name = computed(() => this.slot()?.pokemon.name ?? `Slot ${this.index() + 1}`);
  protected readonly types = computed(() => this.slot()?.pokemon.types ?? []);
  protected readonly moveCount = computed(() => this.slot()?.moves.length ?? 0);

  protected readonly imageSrc = computed(() => {
    const slot = this.slot();
    if (!slot) return POKEMON_PLACEHOLDER_SPRITE;

    const id = slot.pokemon.id;

    if (this.failedId() === id) {
      return POKEMON_PLACEHOLDER_SPRITE;
    }

    const loaded = this.loaded();

    return loaded?.id === id ? loaded.url : POKEMON_PLACEHOLDER_SPRITE;
  });

  protected readonly isEmpty = computed(() => this.slot() === null);

  constructor() {
    effect(() => {
      const slot = this.slot();

      if (!slot || this.currentId === slot.pokemon.id) {
        return;
      }

      this.currentId = slot.pokemon.id;
      void this.loadSprite(slot.pokemon);
    });

    this.destroyRef.onDestroy(() => {
      if (this.currentId !== null) {
        this.sprites.release(this.currentId);
      }
    });
  }

  protected onImageError(): void {
    const slot = this.slot();
    if (slot) {
      this.failedId.set(slot.pokemon.id);
    }
  }

  protected onRemove(): void {
    this.remove.emit(this.index());
  }

  protected onMoveUp(): void {
    this.moveUp.emit(this.index());
  }

  protected onMoveDown(): void {
    this.moveDown.emit(this.index());
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