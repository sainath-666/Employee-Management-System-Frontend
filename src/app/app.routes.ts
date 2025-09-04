import { Routes } from '@angular/router';
import { Login } from './components/login/login';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' }, // default route
    { path: 'login', component: Login},    

    {
        path: 'empform',
        loadComponent: () => import('./components/employee-form/employee-form').then(m => m.EmployeeFormComponent)
    }
];
