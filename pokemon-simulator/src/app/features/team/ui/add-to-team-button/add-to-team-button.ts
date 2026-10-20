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
import { TeamStore } from '../../stores/team.store';
import { POKEDEX_REPOSITORY } from '../../../pokedex/data-access/pokedex.repository';

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
  readonly canAdd = computed(() => !this._loading() && !this.isFull() && !this.isInTeam());

  readonly disabledReason = computed(() => {
    if (this._loading()) return 'Adding…';
    if (this.isFull()) return 'Team is full (6/6)';
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
        this._message.set(`${pokemon.name.capitalize()} added to slot ${result.index + 1}`);
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
}

declare global {
  interface String {
    capitalize(): string;
  }
}

String.prototype.capitalize = function (): string {
  return this.charAt(0).toUpperCase() + this.slice(1);
};