// src/app/services/roles.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Role {
  id?: number;
  roleName: string;
  status: boolean;
  createdBy?: string | null;
  createdDateTime?: string;
  updatedBy?: string | null;
  updatedDateTime?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private baseUrl = 'https://localhost:7056/api/Roles'; // ✅ change port if needed

  constructor(private http: HttpClient) {}

  // Get all roles
  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.baseUrl);
  }

  // Get role by ID
  getRoleById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/${id}`);
  }

  // Create new role
  createRole(role: Role): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, role);
  }

  // Update role
  updateRole(id: number, role: Role): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, role);
  }

  // Delete role
  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}