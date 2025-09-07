import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { LeaveForm } from './components/leave-form/leave-form';
import { PayslipList } from './components/payslip-list/payslip-list';
import { EmployeeForm } from './components/employee-form/employee-form';
import { LeaveManagement } from './components/leave-management/leave-management';
import { PayslipForm } from './components/payslip-form/payslip-form';
import { DepartmentForm } from './components/department-form/department-form';
import { EmployeeDetails } from './components/employee-details/employee-details';
import { EmployeeViewComponent } from './components/employee-view/employee-view';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'leave-form', component: LeaveForm, canActivate: [authGuard] },
  { path: 'payslip-list', component: PayslipList, canActivate: [authGuard] },
  { path: 'employee-form', component: EmployeeForm, canActivate: [authGuard] },
  { path: 'leave-management', component:LeaveManagement , canActivate: [authGuard] },
  { path: 'payslip-form', component: PayslipForm, canActivate: [authGuard] },
  { path: 'department-form', component: DepartmentForm, canActivate: [authGuard ] },
  { path : 'emp-details',component:EmployeeDetails,canActivate:[authGuard]},
  { path: 'employee-view', component: EmployeeViewComponent, canActivate: [authGuard] }
];
