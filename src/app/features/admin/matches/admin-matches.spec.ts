import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Matches } from '../../../@core/services/matches';
import { Notifications } from '../../../@core/services/notifications';
import { Tournaments } from '../../../@core/services/tournaments';
import { AdminMatches } from './admin-matches';

describe('AdminMatches', () => {
  let component: AdminMatches;
  let fixture: ComponentFixture<AdminMatches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMatches],
      providers: [
        { provide: Matches, useValue: { getAllMatches: () => of([]) } },
        { provide: Tournaments, useValue: { getAllTournaments: () => of([]) } },
        { provide: MatDialog, useValue: {} },
        { provide: Notifications, useValue: { error: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMatches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
