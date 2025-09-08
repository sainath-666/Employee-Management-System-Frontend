// src/app/services/department-employee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DepartmentEmployeeRequest } from '../interfaces/departmentemployeerequest';

interface DepartmentDetails {
  id: number;
  departmentName: string;
  status: boolean;
  createdBy: number | null;
  createdDateTime: string;
  updatedBy: number | null;
  updatedDateTime: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DepartmentEmployeeService {
  private baseUrl = 'https://localhost:7056/api/DepartmentEmployee';

  constructor(private http: HttpClient) {}

  // Assign one employee to multiple departments
  assignDepartments(request: DepartmentEmployeeRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}`, request, {
      responseType: 'text',
    });
  }

  // Get all departments assigned to an employee
  getDepartmentsForEmployee(
    employeeId: number
  ): Observable<DepartmentDetails[]> {
    console.log('Fetching departments for employee:', employeeId);
    return this.http
      .get<DepartmentDetails[]>(`${this.baseUrl}/${employeeId}`)
      .pipe(
        tap((response) => {
          console.log(
            'Department API Response for employee',
            employeeId,
            ':',
            response
          );
        })
      );
  }

  // Remove a department from an employee
  removeDepartmentFromEmployee(
    employeeId: number,
    departmentId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${employeeId}/${departmentId}`
    );
  }
}
