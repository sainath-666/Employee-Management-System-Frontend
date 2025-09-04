import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Model interface (optional but recommended)
export interface Department {
  id: number;
  departmentName: string;
  status: boolean;
  description?: string;
  createdBy?: string | null;
  createdDateTime?: string; 
  updatedBy?: string | null;
  updatedDateTime?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private baseUrl = 'https://localhost:7056/api/Department'; // Adjust backend URL if needed

  constructor(private http: HttpClient) {}

  // 🔹 Get all departments
  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}`);
  }

  // 🔹 Get department by ID
  getDepartment(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Add department
  addDepartment(department: Department): Observable<Department> {
    return this.http.post<Department>(`${this.baseUrl}`, department);
  }

  // 🔹 Update department
  updateDepartment(id: number, department: Department): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, department);
  }

  // 🔹 Delete department
  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}