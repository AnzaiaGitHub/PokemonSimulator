import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Move, PokemonIndexEntry } from '../../../../core/models';
import { PokemonTypeBadge } from '../../../../shared/ui/pokemon-type-badge/pokemon-type-badge';
import { BattleSide } from '../../engine';
import { BattleStore } from '../../stores/battle.store';
import { formatIdentifier } from '../../utils/battle-format';

@Component({
  selector: 'app-battle-fighter-config',
  imports: [FormsModule, RouterLink, PokemonTypeBadge],
  templateUrl: './battle-fighter-config.html',
  styleUrl: './battle-fighter-config.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFighterConfig {
  private readonly store = inject(BattleStore);

  readonly side = input.required<BattleSide>();

  protected readonly label = computed(() => (this.side() === 'player' ? 'Player 1' : 'Player 2'));
  protected readonly config = computed(() =>
    this.side() === 'player' ? this.store.player() : this.store.opponent(),
  );
  protected readonly teamSlots = this.store.teamSlots;
  protected readonly teamStatus = this.store.teamStatus;
  protected readonly pokedexIndex = this.store.pokedexIndex;
  protected readonly pokedexStatus = this.store.pokedexStatus;
  protected readonly pokedexError = this.store.pokedexError;
  protected readonly maxMoves = this.store.maxMoves;

  protected readonly search = signal('');
  protected readonly moveSearch = signal('');

  protected readonly filteredPokemon = computed(() => {
    const query = this.search().trim().toLowerCase();

    return this.pokedexIndex()
      .filter((pokemon) => !query || pokemon.name.includes(query))
      .slice(0, 10);
  });

  protected readonly filteredMoves = computed(() => {
    const query = this.moveSearch().trim().toLowerCase();

    return this.config().availableMoves.filter((move) => !query || move.name.includes(query));
  });

  protected readonly selectedNames = computed(
    () => new Set(this.config().moves.map((move) => move.name)),
  );
  protected readonly selectedCount = computed(() => this.config().moves.length);
  protected readonly canAddMove = computed(() => this.selectedCount() < this.maxMoves);
  protected readonly teamHasPokemon = computed(() =>
    this.teamSlots().some((slot) => slot !== null),
  );

  protected setSource(source: 'team' | 'pokedex'): void {
    this.store.setSource(this.side(), source);
  }

  protected onTeamSlotChange(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || event.target.value === '') {
      return;
    }

    this.store.selectTeamSlot(this.side(), Number(event.target.value));
  }

  protected selectPokedexPokemon(entry: PokemonIndexEntry): void {
    void this.store.selectPokedexPokemon(this.side(), entry.name);
  }

  protected toggleMove(move: Move): void {
    this.store.toggleMove(this.side(), move);
  }

  protected isMoveSelected(move: Move): boolean {
    return this.selectedNames().has(move.name);
  }

  protected isMoveDisabled(move: Move): boolean {
    return !this.isMoveSelected(move) && !this.canAddMove();
  }

  protected onSearchInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.search.set(event.target.value);
    }
  }

  protected onMoveSearchInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.moveSearch.set(event.target.value);
    }
  }

  protected formatName(name: string): string {
    return formatIdentifier(name);
  }

  protected trackEntry(_index: number, entry: PokemonIndexEntry): number {
    return entry.id;
  }

  protected trackMove(_index: number, move: Move): string {
    return move.name;
  }
}
