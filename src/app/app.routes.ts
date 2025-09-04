import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'empform',
        loadComponent: () => import('./components/employee-form/employee-form').then(m => m.EmployeeFormComponent)
      }
];
