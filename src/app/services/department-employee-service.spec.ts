import { TestBed } from '@angular/core/testing';

import { DepartmentEmployeeService } from './department-employee-service';

describe('DepartmentEmployeeService', () => {
  let service: DepartmentEmployeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepartmentEmployeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
