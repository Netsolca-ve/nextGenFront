import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTournaments } from './admin-tournaments';

describe('AdminTournaments', () => {
  let component: AdminTournaments;
  let fixture: ComponentFixture<AdminTournaments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournaments],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournaments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
