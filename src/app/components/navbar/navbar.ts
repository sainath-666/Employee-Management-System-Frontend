import { CommonModule } from '@angular/common';

import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
})
export class Navbar implements AfterViewInit, OnInit {
  roleid: number = 0;
  userName: string = '';
  employeeId: number | null = null;
  profilePhotoUrl: string | null = null;

  constructor(
    private el: ElementRef,
    private authService: AuthService,
    private router: Router,
    private employeeService: EmployeeService
  ) {}


  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.roleid = this.authService.getCurrentUserRole() || 0;
      this.userName = this.authService.getCurrentUserName() || 'User';
      this.employeeId = this.authService.getCurrentEmployeeId();

      // Load employee details for profile photo
      if (this.employeeId) {
        this.employeeService.getEmployeeById(this.employeeId).subscribe({
          next: (employee) => {
            if (employee.profilePhotoPath) {
              this.profilePhotoUrl = this.employeeService.imageApiUrl + employee.profilePhotoPath;
            }
          },
          error: (error) => {
            console.error('Error loading employee photo:', error);
          }
        });
      }
    }
  }

  ngAfterViewInit(): void {
    // Initialize sidebar in closed state
    const sidebar = this.el.nativeElement.querySelector(
      '#mobile-sidebar'
    ) as HTMLElement;
    if (sidebar) {
      sidebar.classList.add('-translate-x-full');
    }
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  openSidebar(): void {
    const sidebar = this.el.nativeElement.querySelector(
      '#mobile-sidebar'
    ) as HTMLElement;
    if (sidebar) {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
    }
  }

  closeSidebar(): void {
    const sidebar = this.el.nativeElement.querySelector(
      '#mobile-sidebar'
    ) as HTMLElement;
    if (sidebar) {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
    }
  }

  viewProfile(): void {
    if (this.employeeId) {
      this.router.navigate(['/employee-form', this.employeeId]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
