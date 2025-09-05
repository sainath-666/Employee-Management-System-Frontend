// src/app/services/department-employee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DepartmentEmployeeRequest } from '../interfaces/departmentemployeerequest';
import { Department } from './department.service';

// Department model (adjust fields as per your backend Department entity)

@Injectable({
  providedIn: 'root',
})
export class DepartmentEmployeeService {
  private baseUrl = 'https://localhost:7056/api/DepartmentEmployee';

  constructor(private http: HttpClient) {}

  // Assign one employee to multiple departments
  assignDepartments(request: DepartmentEmployeeRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}`, request, {
      responseType: 'text', // Expect text response
    });
  }

  // Get all departments assigned to an employee
  getDepartmentsForEmployee(employeeId: number): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/${employeeId}`);
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
