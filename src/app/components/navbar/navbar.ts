import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',

})
export class Navbar implements AfterViewInit {

  constructor(private el: ElementRef,private router:Router) {}

  ngAfterViewInit(): void {
    // Initialize sidebar in closed state
    const sidebar = this.el.nativeElement.querySelector('#mobile-sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.classList.add('-translate-x-full');
    }
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  openSidebar(): void {
    const sidebar = this.el.nativeElement.querySelector('#mobile-sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
    }
  }

  closeSidebar(): void {
    const sidebar = this.el.nativeElement.querySelector('#mobile-sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
    }
  }

  roleid=10;

}
