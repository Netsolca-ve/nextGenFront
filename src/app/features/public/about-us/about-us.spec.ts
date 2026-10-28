import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AboutUs } from './about-us';

describe('AboutUs', () => {
  let component: AboutUs;
  let fixture: ComponentFixture<AboutUs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUs],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar los iconos lucide con clase icon y size 40', () => {
    const el = fixture.nativeElement as HTMLElement;
    const goal = el.querySelector('svg[lucideGoal]');
    const eye = el.querySelector('svg[lucideEye]');
    expect(goal).toBeTruthy();
    expect(eye).toBeTruthy();
    for (const svg of [goal!, eye!]) {
      expect(svg.classList.contains('icon')).toBe(true);
      expect(svg.outerHTML).toMatch(/width="40"/);
      expect(svg.outerHTML).toMatch(/(stroke|color)="#1B232F"/);
    }
  });
});
