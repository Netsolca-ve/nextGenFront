import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminMatches } from './admin-matches';

describe('AdminMatches', () => {
  let component: AdminMatches;
  let fixture: ComponentFixture<AdminMatches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMatches],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMatches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
