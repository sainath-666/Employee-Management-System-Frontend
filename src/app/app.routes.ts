import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { LeaveForm } from './components/leave-form/leave-form';
import { PayslipListComponent } from './components/payslip-list/payslip-list';
import { EmployeeForm } from './components/employee-form/employee-form';
import { LeaveManagement } from './components/leave-management/leave-management';
import { PayslipForm } from './components/payslip-form/payslip-form';
import { DepartmentForm } from './components/department-form/department-form';
import { EmployeeDetails } from './components/employee-details/employee-details';
import { EmployeeViewComponent } from './components/employee-view/employee-view';
import { RoleGuard } from './guards/role.guard';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'leave-form', component: LeaveForm, canActivate: [RoleGuard], data: { role: 2 } },
  { path: 'payslip-list', component: PayslipListComponent, canActivate:  [RoleGuard], data: { role: [2,9,10] } },
  { path: 'employee-form', component: EmployeeForm, canActivate:  [RoleGuard], data: { role: 10 } },
  { path: 'employee-form/:id', component: EmployeeForm, canActivate:  [RoleGuard], data: { role: 10 } },
  { path: 'leave-management', component:LeaveManagement , canActivate:[RoleGuard], data: { role: [9,10] } },
  { path: 'payslip-form', component: PayslipForm, canActivate:  [RoleGuard], data: { role: 9 }},
  { path: 'department-form', component: DepartmentForm, canActivate:  [RoleGuard], data: { role: 2 } },
  { path : 'emp-details',component:EmployeeDetails,canActivate:[RoleGuard], data: { role: [2,9,10] }},
  { path: 'employee-view', component: EmployeeViewComponent, canActivate:  [RoleGuard], data: { role: [9,10] } }
];
