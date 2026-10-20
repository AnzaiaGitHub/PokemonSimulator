import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  Move,
  MoveDamageClass,
  POKEMON_TYPE_NAMES,
  PokemonTypeName,
  TeamSlot,
} from '../../../../core/models';
import { PokemonTypeBadge } from '../../../../shared/ui/pokemon-type-badge/pokemon-type-badge';
import { MoveCatalog } from '../../data-access/move-catalog';
import { TeamStore } from '../../stores/team.store';
import {
  formatMoveName,
  hasAttackingMove,
  MAX_MOVES_PER_POKEMON,
  maxMovesValidator,
  pickDefaultMoves,
  uniqueMovesValidator,
} from '../../utils/move-selection';

type MoveStatus = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-move-selector',
  imports: [ReactiveFormsModule, PokemonTypeBadge],
  templateUrl: './move-selector.html',
  styleUrl: './move-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'requestClose()',
  },
})
export class MoveSelector {
  private readonly moveCatalog = inject(MoveCatalog);
  private readonly teamStore = inject(TeamStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly slot = input.required<TeamSlot>();
  readonly index = input.required<number>();
  readonly closed = output<void>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private initialized = false;
  private destroyed = false;

  protected readonly maxMoves = MAX_MOVES_PER_POKEMON;
  protected readonly typeOptions = POKEMON_TYPE_NAMES;
  protected readonly damageClasses: readonly MoveDamageClass[] = ['physical', 'special', 'status'];

  protected readonly form = inject(NonNullableFormBuilder).group({
    search: [''],
    type: [''],
    damageClass: [''],
    selected: [[] as string[], [maxMovesValidator(), uniqueMovesValidator()]],
  });

  protected readonly status = signal<MoveStatus>('loading');
  protected readonly moves = signal<readonly Move[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly warningMessage = signal<string | null>(null);
  protected readonly progressLoaded = signal(0);
  protected readonly progressFailed = signal(0);
  protected readonly progressTotal = signal(0);
  protected readonly defaultsAssigned = signal(false);

  private readonly searchValue = toSignal(this.form.controls.search.valueChanges, {
    initialValue: '',
  });
  private readonly typeValue = toSignal(this.form.controls.type.valueChanges, {
    initialValue: '' as PokemonTypeName | '',
  });
  private readonly damageClassValue = toSignal(this.form.controls.damageClass.valueChanges, {
    initialValue: '' as MoveDamageClass | '',
  });
  private readonly selectedNames = toSignal(this.form.controls.selected.valueChanges, {
    initialValue: [] as string[],
  });

  private readonly movesByName = computed(
    () => new Map(this.moves().map((move) => [move.name, move])),
  );

  protected readonly selectedMoves = computed(() =>
    this.selectedNames()
      .map((name) => this.movesByName().get(name))
      .filter((move): move is Move => move !== undefined),
  );
  protected readonly selectedCount = computed(() => this.selectedNames().length);
  protected readonly hasAttackMove = computed(() => hasAttackingMove(this.selectedMoves()));
  protected readonly filteredMoves = computed(() => {
    const search = this.searchValue().trim().toLowerCase();
    const type = this.typeValue();
    const damageClass = this.damageClassValue();

    return this.moves()
      .filter(
        (move) =>
          (!search || move.name.includes(search)) &&
          (!type || move.type === type) &&
          (!damageClass || move.damageClass === damageClass),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  protected readonly tooManySelected = computed(() =>
    this.form.controls.selected.hasError('maxMoves'),
  );
  protected readonly duplicatedSelected = computed(() =>
    this.form.controls.selected.hasError('duplicateMoves'),
  );

  constructor() {
    effect(() => {
      const slot = this.slot();

      if (this.initialized) {
        return;
      }

      this.initialized = true;
      this.form.controls.selected.setValue(slot.moves.map((move) => move.name));
      void this.loadMoves(slot);
    });

    afterNextRender(() => this.searchInput()?.nativeElement.focus());
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }

  protected isSelected(name: string): boolean {
    return this.selectedNames().includes(name);
  }

  protected isDisabled(move: Move): boolean {
    return !this.isSelected(move.name) && this.selectedCount() >= this.maxMoves;
  }

  protected onToggle(move: Move, event: Event): void {
    const checked = event.target instanceof HTMLInputElement && event.target.checked;
    const current = this.form.controls.selected.value;

    if (checked) {
      if (current.length >= this.maxMoves || current.includes(move.name)) {
        return;
      }

      this.form.controls.selected.setValue([...current, move.name]);
      return;
    }

    this.form.controls.selected.setValue(current.filter((name) => name !== move.name));
  }

  protected apply(): void {
    if (this.form.controls.selected.invalid) {
      return;
    }

    const result = this.teamStore.setMoves(this.index(), this.selectedMoves());

    if (!result.ok) {
      this.errorMessage.set(result.message);
      return;
    }

    this.closed.emit();
  }

  protected requestClose(): void {
    this.closed.emit();
  }

  protected retry(): void {
    void this.loadMoves(this.slot());
  }

  protected formatName(name: string): string {
    return formatMoveName(name);
  }

  protected trackMove(_index: number, move: Move): string {
    return move.name;
  }

  private async loadMoves(slot: TeamSlot): Promise<void> {
    this.status.set('loading');
    this.errorMessage.set(null);
    this.warningMessage.set(null);
    this.progressLoaded.set(0);
    this.progressFailed.set(0);
    this.progressTotal.set(slot.pokemon.learnset.length);

    const result = await this.moveCatalog.loadMoves(slot.pokemon.learnset, (progress) => {
      if (this.destroyed) {
        return;
      }

      this.progressLoaded.set(progress.loaded);
      this.progressFailed.set(progress.failed);
      this.progressTotal.set(progress.total);
    });

    if (this.destroyed) {
      return;
    }

    this.moves.set(result.moves);

    if (result.moves.length === 0 && result.failed.length > 0) {
      this.status.set('error');
      this.errorMessage.set(
        'Could not load the moves for this Pokémon. Check your connection and try again.',
      );
      return;
    }

    this.status.set('ready');

    if (result.failed.length > 0) {
      this.warningMessage.set(
        `${result.failed.length} move${result.failed.length === 1 ? '' : 's'} could not be loaded.`,
      );
    }

    this.applyDefaultsIfNeeded(result.moves);
  }

  private applyDefaultsIfNeeded(moves: readonly Move[]): void {
    if (this.slot().moves.length > 0 || this.form.controls.selected.value.length > 0) {
      return;
    }

    const defaults = pickDefaultMoves(moves);

    if (defaults.length === 0) {
      return;
    }

    this.form.controls.selected.setValue(defaults.map((move) => move.name));

    if (this.teamStore.setMoves(this.index(), defaults).ok) {
      this.defaultsAssigned.set(true);
    }
  }
}
