import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TeamStore, TEAM_SIZE } from '../../stores/team.store';
import { TeamSlotCard } from '../../ui/team-slot-card/team-slot-card';
import { TeamSummary } from '../../ui/team-summary/team-summary';
import { TeamSummaryStore } from '../../stores/team-summary/team-summary.store';
import { AsyncState } from '../../../../shared/ui/async-state/async-state';

@Component({
  selector: 'app-team-management',
  imports: [DragDropModule, TeamSlotCard, TeamSummary, AsyncState],
  templateUrl: './team-management.html',
  styleUrl: './team-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamManagement {
  private readonly teamStore = inject(TeamStore);
  private readonly summaryStore = inject(TeamSummaryStore);

  readonly localSlots = signal<readonly (number | null)[]>(
    Array.from({ length: TEAM_SIZE }, (_, i) => i),
  );

  readonly slots = this.teamStore.slots;
  readonly occupiedCount = this.teamStore.occupiedCount;
  readonly isFull = this.teamStore.isFull;
  readonly status = this.teamStore.status;
  readonly error = this.teamStore.error;

  readonly summary = this.summaryStore.summary;
  readonly summaryStatus = this.summaryStore.status;

  constructor() {
    this.teamStore.load();
    effect(() => {
      this.summaryStore.load();
    });
  }

  drop(event: CdkDragDrop<readonly (number | null)[]>): void {
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (previousIndex === currentIndex) return;

    this.teamStore.swapSlots(previousIndex, currentIndex);
    moveItemInArray(this.localSlots() as unknown as (number | null)[], previousIndex, currentIndex);
    this.localSlots.set([...this.localSlots()]);
  }

  moveUp(index: number): void {
    if (index > 0) {
      this.teamStore.swapSlots(index, index - 1);
      const arr = [...this.localSlots()];
      moveItemInArray(arr, index, index - 1);
      this.localSlots.set(arr);
    }
  }

  moveDown(index: number): void {
    if (index < TEAM_SIZE - 1) {
      this.teamStore.swapSlots(index, index + 1);
      const arr = [...this.localSlots()];
      moveItemInArray(arr, index, index + 1);
      this.localSlots.set(arr);
    }
  }

  remove(index: number): void {
    this.teamStore.removePokemon(index);
  }

  canMoveUp(index: number): boolean {
    return index > 0;
  }

  canMoveDown(index: number): boolean {
    return index < TEAM_SIZE - 1;
  }
}