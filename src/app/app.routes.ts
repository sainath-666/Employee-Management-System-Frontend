import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { LeaveForm } from './components/leave-form/leave-form';
import { PayslipListComponent } from './components/payslip-list/payslip-list';
import { PayslipForm } from './components/payslip-form/payslip-form';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'payslips', pathMatch: 'full' },
    { path: 'login', component: Login },
    { 
        path: 'leave-form', 
        component: LeaveForm,
        canActivate: [authGuard]
    },
    { 
        path: 'payslips', 
        component: PayslipListComponent,
        canActivate: [authGuard]
    },
    { 
        path: 'payslips/new', 
        component: PayslipForm,
        canActivate: [authGuard]
    },
    { 
        path: 'payslips/generate', 
        component: PayslipForm,
        canActivate: [authGuard]
    },
    { 
        path: 'payslips/:id/edit', 
        component: PayslipForm,
        canActivate: [authGuard]
    }


];
