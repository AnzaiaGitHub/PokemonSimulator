import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TeamStore, TEAM_SIZE, TeamSlots } from '../../stores/team.store';
import { TeamSummaryStore } from '../../stores/team-summary/team-summary.store';
import { TeamManagement } from './team-management';

describe('TeamManagement', () => {
  let fixture: ComponentFixture<TeamManagement>;

  const mockSlots = signal<Array<{ pokemon: { name: string; types: string[]; id: number }; moves: [] } | null>>(
    Array.from({ length: TEAM_SIZE }, (_, i) => (i < 2 ? { pokemon: { name: `poke-${i + 1}`, types: ['normal'], id: i + 1 }, moves: [] } : null)),
  );

  const mockTeamStore = {
    slots: mockSlots.asReadonly(),
    occupiedCount: signal(2).asReadonly(),
    isFull: signal(false).asReadonly(),
    status: signal<'idle' | 'loading' | 'ready' | 'error'>('ready').asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    swapSlots: vi.fn(() => true),
    removePokemon: vi.fn(() => true),
    load: vi.fn(() => Promise.resolve()),
    teamSize: TEAM_SIZE,
  };

  const mockSummaryStore = {
    summary: signal({
      presentTypes: ['normal'],
      weaknesses: [{ type: 'fighting' as const, multiplier: 2 }],
      resistances: [],
      immunities: [],
    }).asReadonly(),
    status: signal<'idle' | 'loading' | 'ready' | 'error'>('ready').asReadonly(),
    load: vi.fn(() => Promise.resolve()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamManagement],
      providers: [
        provideRouter([]),
        { provide: TeamStore, useValue: mockTeamStore },
        { provide: TeamSummaryStore, useValue: mockSummaryStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamManagement);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders team slots', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const slotCards = compiled.querySelectorAll('app-team-slot-card');

    expect(slotCards.length).toBe(TEAM_SIZE);
  });

  it('shows occupied count', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('2/6');
  });

  it('calls swapSlots on drop', () => {
    const component = fixture.componentInstance;
    const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<TeamSlots>;

    component.drop(event);

    expect(mockTeamStore.swapSlots).toHaveBeenCalledWith(0, 1);
  });

  it('calls removePokemon on remove', () => {
    const component = fixture.componentInstance;

    component.remove(0);

    expect(mockTeamStore.removePokemon).toHaveBeenCalledWith(0);
  });

  it('calls swapSlots on moveUp', () => {
    const component = fixture.componentInstance;

    component.moveUp(1);

    expect(mockTeamStore.swapSlots).toHaveBeenCalledWith(1, 0);
  });

  it('calls swapSlots on moveDown', () => {
    const component = fixture.componentInstance;

    component.moveDown(0);

    expect(mockTeamStore.swapSlots).toHaveBeenCalledWith(0, 1);
  });
});