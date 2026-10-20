import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Pokemon } from '../../../../core/models';
import { capitalizeName, TeamStore } from '../../stores/team.store';
import { POKEDEX_REPOSITORY } from '../../../pokedex/data-access/pokedex.repository';
import { MoveCatalog } from '../../data-access/move-catalog';
import { pickDefaultMoves } from '../../utils/move-selection';

@Component({
  selector: 'app-add-to-team-button',
  imports: [],
  templateUrl: './add-to-team-button.html',
  styleUrl: './add-to-team-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToTeamButton {
  private readonly teamStore = inject(TeamStore);
  private readonly repository = inject(POKEDEX_REPOSITORY);
  private readonly moveCatalog = inject(MoveCatalog);

  readonly pokemon = input<Pokemon | null>(null);
  readonly name = input.required<string>();

  private readonly _loading = signal(false);
  private readonly _message = signal<string | null>(null);
  private readonly _messageType = signal<'success' | 'error' | 'info'>('info');

  readonly loading = this._loading.asReadonly();
  readonly message = this._message.asReadonly();
  readonly messageType = this._messageType.asReadonly();

  readonly isInTeam = computed(() => this.teamStore.hasPokemon(this.name()));
  readonly isFull = this.teamStore.isFull;
  readonly isTeamReady = this.teamStore.isReady;
  readonly canAdd = computed(
    () => this.isTeamReady() && !this._loading() && !this.isFull() && !this.isInTeam(),
  );

  readonly disabledReason = computed(() => {
    if (!this.isTeamReady()) return 'Loading your team…';
    if (this._loading()) return 'Adding…';
    if (this.isFull()) return 'Team is full (6/6). Remove a Pokémon to add another.';
    if (this.isInTeam()) return 'Already in team';
    return null;
  });

  constructor() {
    effect(() => {
      const msg = this._message();
      if (msg) {
        setTimeout(() => this._message.set(null), 3000);
      }
    });
  }

  async add(): Promise<void> {
    if (!this.canAdd()) return;

    this._loading.set(true);
    this._message.set(null);

    try {
      const pokemon = this.pokemon() ?? (await this.fetchPokemon(this.name()));
      const result = this.teamStore.addPokemon(pokemon);

      if (result.ok) {
        const defaultMoves = await this.applyCachedDefaults(result.index, pokemon);
        const suffix =
          defaultMoves > 0
            ? ` with ${defaultMoves} default move${defaultMoves === 1 ? '' : 's'}`
            : '';

        this._message.set(
          `${capitalizeName(pokemon.name)} added to slot ${result.index + 1}${suffix}`,
        );
        this._messageType.set('success');
      } else {
        this._message.set(result.message);
        this._messageType.set('error');
      }
    } catch {
      this._message.set('Failed to add Pokémon. Try again.');
      this._messageType.set('error');
    } finally {
      this._loading.set(false);
    }
  }

  private async fetchPokemon(name: string): Promise<Pokemon> {
    const { data } = await firstValueFrom(this.repository.getPokemon(name));
    return data;
  }

  private async applyCachedDefaults(index: number, pokemon: Pokemon): Promise<number> {
    try {
      const cached = await this.moveCatalog.getCachedMoves(pokemon.learnset);
      const defaults = pickDefaultMoves(cached);

      if (defaults.length === 0) {
        return 0;
      }

      return this.teamStore.setMoves(index, defaults).ok ? defaults.length : 0;
    } catch {
      return 0;
    }
  }
}
