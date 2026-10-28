import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar los 4 iconos lucide con size 48 y color', () => {
    const el = fixture.nativeElement as HTMLElement;
    const icons = el.querySelectorAll(
      'svg[lucideVolleyball], svg[lucideTrendingUp], svg[lucideShieldHalf], svg[lucideGraduationCap]'
    );
    expect(icons.length).toBe(4);
    for (const svg of icons) {
      expect(svg.outerHTML).toMatch(/width="48"/);
      expect(svg.outerHTML).toMatch(/(stroke|color)="#0094DD"/);
    }
  });
});
