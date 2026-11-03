import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Event } from './event';

describe('Event', () => {
  let component: Event;
  let fixture: ComponentFixture<Event>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Event],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'futsal-cup' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Event);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
