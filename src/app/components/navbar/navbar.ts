import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [CommonModule],
  standalone: true
})
export class NavbarComponent {
  @Input() isLoginPage: boolean = false;
  
  // Company information
  companyName: string = 'Employee Management System';
  companyLogoUrl: string = 'assets/images/company-logo.png';
  
  // User information
  userName: string = 'John Doe';
  userPhotoUrl: string = 'assets/images/default-user.png';
  userRole: 'EMPLOYEE' | 'HR' | 'ADMIN' = 'EMPLOYEE'; // Default to EMPLOYEE

  constructor() {
    // For testing purposes, you can change the role here
    this.userRole = 'HR'; // Try 'EMPLOYEE', 'HR', or 'ADMIN'
  }

  // Switch role (for testing)
  switchRole() {
    if (this.userRole === 'EMPLOYEE') this.userRole = 'HR';
    else if (this.userRole === 'HR') this.userRole = 'ADMIN';
    else this.userRole = 'EMPLOYEE';
  }

  logout() {
    // TODO: Implement logout logic
    console.log('Logging out...');
  }

  // Helper methods to check user role
  isEmployee(): boolean {
    return this.userRole === 'EMPLOYEE';
  }

  isHR(): boolean {
    return this.userRole === 'HR';
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }
}
