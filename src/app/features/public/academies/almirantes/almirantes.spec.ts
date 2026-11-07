import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Almirantes } from './almirantes';

describe('Almirantes', () => {
  let component: Almirantes;
  let fixture: ComponentFixture<Almirantes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Almirantes],
    }).compileComponents();

    fixture = TestBed.createComponent(Almirantes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar los iconos lucide con sus clases y size por defecto', () => {
    const el = fixture.nativeElement as HTMLElement;
    const mapPin = el.querySelector('svg[lucideMapPin]');
    expect(mapPin).toBeTruthy();
    expect(mapPin!.classList.contains('icon')).toBe(true);
    expect(mapPin!.outerHTML).toMatch(/width="24"/);
    // todos los iconos del template deben renderizar como svg con atributo lucide*
    const count = el.querySelectorAll(
      'svg[lucideGoal], svg[lucideMapPin], svg[lucideGraduationCap], svg[lucideStar], ' +
        'svg[lucideIdCard], svg[lucideFilePenLine], svg[lucideBadgeCheck], svg[lucideUserGroup], ' +
        'svg[lucideTarget], svg[lucideUser], svg[lucideDumbbell], svg[lucideSportShoe], svg[lucideWhistle]'
    ).length;
    expect(count).toBe(18);
    // clases de variantes preservadas
    expect(el.querySelectorAll('svg.icon4').length).toBe(1); // SportShoe
    expect(el.querySelectorAll('svg.icon3').length).toBe(0); // plan3 está comentado en el template
    expect(el.querySelectorAll('svg.icon2').length).toBe(5); // IdCard, Whistle, GraduationCap, Target, User
  });
});
