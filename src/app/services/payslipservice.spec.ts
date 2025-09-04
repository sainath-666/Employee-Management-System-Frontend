import { TestBed } from '@angular/core/testing';

import { Payslipservice } from './payslipservice';

describe('Payslipservice', () => {
  let service: Payslipservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Payslipservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
