import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { LeaveManagementComponent } from './components/leave-management/leave-management';
import { LoginComponent } from './components/login/login';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'Dashboard',
  },
  {
    path: 'leave-management',
    component: LeaveManagementComponent,
    title: 'Leave Management',
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login',
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
