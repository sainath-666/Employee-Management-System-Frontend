import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private baseUrl = 'https://localhost:7056/api/Employee'; // Adjust if needed
  public imageApiUrl = 'https://localhost:7056/';

  constructor(private http: HttpClient) {}

  // 🔹 Get all employees
  getAllEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }

  // 🔹 Get employee by Id
  getEmployeeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Create employee (accept FormData directly)
  createEmployee(formData: FormData): Observable<any> {
    // Remove Content-Type header to let the browser set it with the boundary
    const headers = new HttpHeaders();
    return this.http.post<any>(`${this.baseUrl}`, formData, { headers });
  }

  // 🔹 Update employee (accept FormData directly)
  updateEmployee(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, formData);
  }

  // 🔹 Delete employee
  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
