import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;
  let component: Pagination;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
  });

  function render(page: number, totalPages: number, totalResults: number): void {
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    fixture.componentRef.setInput('totalResults', totalResults);
    fixture.detectChanges();
  }

  it('emits the previous and next pages', () => {
    render(2, 3, 60);

    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0]?.click();
    buttons[1]?.click();

    expect(emitted).toEqual([1, 3]);
  });

  it('disables the buttons at the limits', () => {
    render(1, 1, 4);

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons[0]?.disabled).toBe(true);
    expect(buttons[1]?.disabled).toBe(true);
  });
});
