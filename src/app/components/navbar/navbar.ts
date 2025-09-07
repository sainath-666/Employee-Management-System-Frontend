import { CommonModule } from '@angular/common';

import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
})
export class Navbar implements AfterViewInit, OnInit {
  roleid: number = 0;
  userName: string = '';

  constructor(
    private el: ElementRef,
    private authService: AuthService,
    private router: Router
  ) {}


  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.roleid = this.authService.getCurrentUserRole() || 0;
      this.userName = this.authService.getCurrentUserName() || 'User';
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
