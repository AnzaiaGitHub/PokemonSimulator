import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
import { TeamStore, TEAM_SIZE, TeamSlots } from '../../stores/team.store';
import { TeamSlotCard } from '../../ui/team-slot-card/team-slot-card';
import { TeamSummary } from '../../ui/team-summary/team-summary';
import { TeamSummaryStore } from '../../stores/team-summary/team-summary.store';
import { AsyncState } from '../../../../shared/ui/async-state/async-state';

@Component({
  selector: 'app-team-management',
  imports: [DragDropModule, RouterLink, TeamSlotCard, TeamSummary, AsyncState],
  templateUrl: './team-management.html',
  styleUrl: './team-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamManagement {
  private readonly teamStore = inject(TeamStore);
  private readonly summaryStore = inject(TeamSummaryStore);

  readonly slots = this.teamStore.slots;
  readonly occupiedCount = this.teamStore.occupiedCount;
  readonly isFull = this.teamStore.isFull;
  readonly status = this.teamStore.status;
  readonly error = this.teamStore.error;

  readonly summary = this.summaryStore.summary;
  readonly summaryStatus = this.summaryStore.status;

  constructor() {
    this.teamStore.load();
    this.summaryStore.load();
  }

  drop(event: CdkDragDrop<TeamSlots>): void {
    this.teamStore.swapSlots(event.previousIndex, event.currentIndex);
  }

  moveUp(index: number): void {
    this.teamStore.swapSlots(index, index - 1);
  }

  moveDown(index: number): void {
    this.teamStore.swapSlots(index, index + 1);
  }

  remove(index: number): void {
    this.teamStore.removePokemon(index);
  }

  trackSlot(index: number, slot: TeamSlots[number]): string | number {
    return slot?.pokemon.id ?? `empty-${index}`;
  }

  canMoveUp(index: number): boolean {
    return index > 0;
  }

  canMoveDown(index: number): boolean {
    return index < TEAM_SIZE - 1;
  }
}