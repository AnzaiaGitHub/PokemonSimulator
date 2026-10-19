import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-async-state',
  imports: [],
  templateUrl: './async-state.html',
  styleUrl: './async-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncState {
  readonly status = input.required<AsyncStatus>();
  readonly isEmpty = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly emptyMessage = input('Nothing to show.');
  readonly retry = output<void>();

  protected readonly skeletonItems = [1, 2, 3, 4, 5, 6, 7, 8] as const;
}
