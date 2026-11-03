import { TestBed } from '@angular/core/testing';
import { Tournaments } from './tournaments';

describe('Tournaments', () => {
  let service: Tournaments;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tournaments);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
