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
});
