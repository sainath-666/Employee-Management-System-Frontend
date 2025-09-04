import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  nameid: string;
  email: string;
  unique_name: string;
  RoleId: string;
  nbf: number;
  exp: number;
  iat: number;
  iss: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://localhost:7056/api/Auth';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private decodeToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) {
      console.log('No token found in storage');
      return null;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log('Successfully decoded token:', decoded);
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  getRoleId(): string | null {
    const decodedToken = this.decodeToken();
    if (decodedToken) {
      console.log('Role ID from token:', decodedToken.RoleId);
      return decodedToken.RoleId;
    }
    console.log('No role ID found in token');
    return null;
  }

  getRoleBasedRoute(): string {
    const roleId = this.getRoleId();
    console.log('Getting route for role ID:', roleId);

    switch (roleId) {
      case '2':
        console.log('Routing to employee dashboard');
        return '/roleid2';
      case '9':
        console.log('Routing to HR dashboard');
        return '/roleid9';
      case '10':
        console.log('Routing to admin dashboard');
        return '/roleid10';
      default:
        console.log('No matching role, redirecting to login');
        return '/login';
    }
  }

  getUserRole(): number {
    const decodedToken = this.decodeToken();
    return decodedToken ? parseInt(decodedToken.RoleId) : 0;
  }

  hasRole(roleId: number): boolean {
    const userRoleId = this.getUserRole();
    return userRoleId === roleId;
  }

  isAdmin(): boolean {
    return this.hasRole(10);
  }

  isHR(): boolean {
    return this.hasRole(9);
  }

  isEmployee(): boolean {
    return this.hasRole(2);
  }
}
