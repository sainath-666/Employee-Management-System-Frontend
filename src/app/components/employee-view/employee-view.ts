import { Component } from '@angular/core';


import { CommonModule } from '@angular/common';

export interface Employee {
  id?: number;
  employeeCode: string;
  name: string;
  email: string;
  mobileNumber: string;
  gender: string;
  dob?: string;
  profilePhotoPath?: string;
  roleId: number;
  // password?: string;
  status?: boolean;
  departments?: number[];
}

@Component({
  selector: 'app-employee-details',
  imports: [CommonModule],
  templateUrl: './employee-view.html',

})
export class EmpDetails {
  // employee: Employee | null = null;
  // departments: Department[] = [];
  // loading = true;
  // error: string | null = null;
  // employeeId: number = 0;

  // constructor(
  //   private route: ActivatedRoute,
  //   private employeeService: EmployeeService,
  //   private departmentEmployeeService: Departmentemployee,
  //   private departmentService: Departments
  // ) {}

  // ngOnInit(): void {
  //   this.route.params.subscribe(params => {
  //     this.employeeId = +params['id'];
  //     if (this.employeeId) {
  //       this.loadEmployeeDetails();
  //     }
  //   });
  // }

  // loadEmployeeDetails(): void {
  //   this.loading = true;
  //   this.error = null;

  //   // First, get employee details
  //   this.employeeService.getEmployeeById(this.employeeId).subscribe({
  //     next: (employee) => {
  //       this.employee = employee;
  //       // Then get departments for this employee
  //       this.loadEmployeeDepartments();
  //     },
  //     error: (err) => {
  //       this.error = 'Failed to load employee details';
  //       this.loading = false;
  //       console.error('Error loading employee:', err);
  //     }
  //   });
  // }

  // loadEmployeeDepartments(): void {
  //   // Get departments assigned to this employee
  //   this.departmentEmployeeService.getDepartmentsForEmployee(this.employeeId).subscribe({
  //     next: (departments) => {
  //       this.departments = departments;
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error loading employee departments:', err);
  //       this.departments = [];
  //       this.loading = false;
  //     }
  //   });
  // }

  // getGenderDisplayText(gender: string): string {
  //   switch (gender?.toLowerCase()) {
  //     case 'm':
  //     case 'male':
  //       return 'Male';
  //     case 'f':
  //     case 'female':
  //       return 'Female';
  //     case 'o':
  //     case 'other':
  //       return 'Other';
  //     default:
  //       return gender || 'Not specified';
  //   }
  // }

  // getStatusDisplayText(status?: boolean): string {
  //   return status ? 'Active' : 'Inactive';
  // }

  // getStatusBadgeClass(status?: boolean): string {
  //   return status
  //     ? 'bg-green-100 text-green-800 border-green-200'
  //     : 'bg-red-100 text-red-800 border-red-200';
  // }

  // formatDate(dateString?: string): string {
  //   if (!dateString) return 'Not provided';
  //   try {
  //     const date = new Date(dateString);
  //     return date.toLocaleDateString();
  //   } catch {
  //     return 'Invalid date';
  //   }
  // }

  // getProfileImageUrl(profilePhotoPath?: string): string {
  //   if (profilePhotoPath) {
  //     // Assuming the backend serves images from a specific endpoint
  //     return `https://localhost:7056/api/Employee/image/${profilePhotoPath}`;
  //   }
  //   return 'assets/images/default-avatar.png'; // Fallback image
  // }

  // removeDepartment(departmentId: number): void {
  //   if (confirm('Are you sure you want to remove this department from the employee?')) {
  //     this.departmentEmployeeService.removeDepartmentFromEmployee(this.employeeId, departmentId).subscribe({
  //       next: () => {
  //         // Reload departments after successful removal
  //         this.loadEmployeeDepartments();
  //       },
  //       error: (err) => {
  //         console.error('Error removing department:', err);
  //         alert('Failed to remove department');
  //       }
  //     });
  //   }
  // }
}
