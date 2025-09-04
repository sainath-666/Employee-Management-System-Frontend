import { TestBed } from '@angular/core/testing';

import { Rolesservice } from './rolesservice';

describe('Rolesservice', () => {
  let service: Rolesservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rolesservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
