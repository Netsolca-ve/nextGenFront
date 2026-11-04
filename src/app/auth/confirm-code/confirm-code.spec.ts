import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmCode } from './confirm-code';

describe('ConfirmCode', () => {
  let component: ConfirmCode;
  let fixture: ComponentFixture<ConfirmCode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmCode],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmCode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
