import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PokemonTypeName } from '../../../core/models';

const TYPE_COLORS: Readonly<Record<PokemonTypeName, string>> = {
  normal: 'bg-slate-400/15 text-slate-200 ring-slate-400/30',
  fire: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
  water: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  electric: 'bg-yellow-400/15 text-yellow-300 ring-yellow-400/30',
  grass: 'bg-green-500/15 text-green-300 ring-green-500/30',
  ice: 'bg-cyan-400/15 text-cyan-300 ring-cyan-400/30',
  fighting: 'bg-red-600/15 text-red-300 ring-red-600/30',
  poison: 'bg-purple-500/15 text-purple-300 ring-purple-500/30',
  ground: 'bg-amber-600/15 text-amber-300 ring-amber-600/30',
  flying: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
  psychic: 'bg-pink-500/15 text-pink-300 ring-pink-500/30',
  bug: 'bg-lime-500/15 text-lime-300 ring-lime-500/30',
  rock: 'bg-stone-500/15 text-stone-300 ring-stone-500/30',
  ghost: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/30',
  dragon: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  dark: 'bg-neutral-600/20 text-neutral-300 ring-neutral-600/40',
  steel: 'bg-zinc-400/15 text-zinc-200 ring-zinc-400/30',
  fairy: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
};

@Component({
  selector: 'app-pokemon-type-badge',
  imports: [],
  template: `
    <span
      [class]="
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ' +
        colorClass()
      "
    >
      {{ type() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonTypeBadge {
  readonly type = input.required<PokemonTypeName>();

  protected readonly colorClass = computed(() => TYPE_COLORS[this.type()]);
}
