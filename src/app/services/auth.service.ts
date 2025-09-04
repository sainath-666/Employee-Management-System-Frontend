import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://localhost:7056/api/Auth';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    console.log(
      'Auth Service: Attempting login with credentials:',
      credentials
    );
    return this.http
      .post(`${this.baseUrl}/login`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        tap((response) =>
          console.log('Auth Service: Login response:', response)
        ),
        catchError((error) => {
          console.error('Auth Service: Login error:', error);
          throw error;
        })
      );
  }

  // Store the token in localStorage after successful login
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Get the stored token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Remove token on logout
  logout(): void {
    localStorage.removeItem('token');
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Decode JWT (base64url) and extract claims
  private getJwtPayload(): any | null {
    const token = this.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // Try multiple common claim names for employee/user id
  getCurrentEmployeeId(): number | null {
    const payload = this.getJwtPayload();
    if (!payload) return null;
    const candidateKeys = [
      'employeeId',
      'empId',
      'nameid',
      'sub',
      'userId',
      'userid',
    ];
    for (const key of candidateKeys) {
      const value = payload[key];
      if (value === undefined || value === null) continue;
      const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
      if (!Number.isNaN(num)) return num;
    }
    return null;
  }
}
