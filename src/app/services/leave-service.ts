import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Leave } from '../interfaces/leave';

// Model interface (optional but recommended)


@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  private baseUrl = 'https://localhost:7056/api/Leave'; // ✅ adjust if needed

  constructor(private http: HttpClient) {}

  // 🔹 Get all leaves
  getAllLeaves(): Observable<Leave[]> {
    return this.http.get<Leave[]>(`${this.baseUrl}`);
  }

  // 🔹 Get leave by ID
  getLeaveById(id: number): Observable<Leave> {
    return this.http.get<Leave>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Create leave
  createLeave(leave: Leave): Observable<any> {
    return this.http.post(`${this.baseUrl}`, leave);
  }

  // 🔹 Update leave
  updateLeave(id: number, leave: Leave): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, leave);
  }

  // 🔹 Delete leave
  deleteLeave(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
