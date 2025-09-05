import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data['role'] as number;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    if (this.authService.getUserRole() !== expectedRole) {
      // Redirect to appropriate dashboard based on actual role
      const actualRole = this.authService.getUserRole();
      switch (actualRole) {
        case 10:
          this.router.navigate(['/dashboard/admin']);
          break;
        case 9:
          this.router.navigate(['/dashboard/hr']);
          break;
        case 2:
          this.router.navigate(['/dashboard/employee']);
          break;
        default:
          this.router.navigate(['/login']);
      }
      return false;
    }

    return true;
  }
}
