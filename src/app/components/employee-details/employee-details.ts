import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DepartmentService } from '../../services/department.service';
import { DepartmentEmployeeService } from '../../services/department-employee.service';

interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  mobileNumber: string;
  profileUrl: string;
  role: string;
  status: string;
  gender: string;
  departments?: string[];
}

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-details.html',
  styleUrl: './employee-details.css',
})
export class EmployeeDetails implements OnInit {
  protected Math = Math; // Add Math object to use in template
  protected employees: Employee[] = [];
  protected filteredEmployees: Employee[] = [];
  protected searchQuery: string = '';
  protected currentPage: number = 1;
  protected itemsPerPage: number = 5;
  protected statusFilter: string = 'all';
  protected roleFilter: string = 'all';
  protected genderFilter: string = 'all';
  protected departments: { id: number; departmentName: string }[] = [];
  protected departmentFilter: string = 'all';


  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private authService: AuthService,
    private deptService:DepartmentService,
    private deptEmpService:DepartmentEmployeeService
  ) {}

  isHR(): boolean {
    return this.authService.isHR();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  imageUrl?: string;
  generatePayslip(employee: Employee): void {
    this.router.navigate(['/payslip-form'], { 
      queryParams: { 
        employeeId: employee.id,
        employeeName: employee.name,
        employeeCode: employee.employeeCode
      } 
    });
  }

  viewEmployee(id: number): void {
    this.router.navigate(['/employee-view'], {
      queryParams: { id: id },
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.imageUrl = this.employeeService.imageApiUrl;
  }

  addEmployee():void{
    this.router.navigate(['/employee-form']);
  }

  

  loadEmployees(): void {
  // Step 1: load all departments first
  this.deptService.getAllDepartments().subscribe({
    next: (allDepts) => {
      this.departments = allDepts;
      const deptMap = new Map(allDepts.map(d => [d.id, d.departmentName]));

      // Step 2: load employees
      this.employeeService.getAllEmployees().subscribe({
        next: (data) => {
          this.employees = data.map((emp) => ({
            id: emp.id,
            employeeCode: emp.employeeCode,
            name: emp.name,
            email: emp.email,
            mobileNumber: emp.mobileNumber,
            profileUrl: emp.profilePhotoPath
              ? `${this.employeeService.imageApiUrl}${emp.profilePhotoPath}`
              : 'assets/images/profi.webp',
            role: emp.role ?? emp.roleName ?? '',
            status: emp.status,
            gender: emp.gender,
            departments: [] // will fill next
          }));

          // Step 3: fetch department IDs for each employee
          this.employees.forEach((emp) => {
            this.deptEmpService.getDepartmentsForEmployee(emp.id).subscribe({
              next: (deptAssignments) => {
                // deptAssignments contains IDs → map to names
                emp.departments = deptAssignments
                  .map(d => deptMap.get(d.id) || "Unknown");
              },
              error: (err) => {
                console.error(`Error fetching departments for employee ${emp.id}`, err);
              }
            });
          });

          this.applyFilters();
        },
        error: (error) => {
          console.error('Error fetching employees:', error);
        },
      });
    },
    error: (err) => {
      console.error("Error fetching departments:", err);
    }
  });
}


  // onImgError(event: Event): void {
  //   const img = event.target as HTMLImageElement;
  //   // Prevent infinite error loop
  //   (img as any).onerror = null;
  //   img.src = 'assets/images/profi.webp';
  // }

  protected applyFilters(): void {
    let filtered = [...this.employees];

    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.employeeCode.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.status === this.statusFilter);
    }

    // Apply role filter
    if (this.departmentFilter !== 'all') {
    filtered = filtered.filter(
      (emp) => emp.departments?.includes(this.departmentFilter)
    );
  }

    // Apply gender filter
    if (this.genderFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.gender === this.genderFilter);
    }

    this.filteredEmployees = filtered;
  }

  protected get totalPages(): number {
    return Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
  }

  protected get paginatedEmployees(): Employee[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredEmployees.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  protected onPageChange(page: number): void {
    this.currentPage = page;
  }

  protected onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  protected onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  protected onEdit(employee: Employee): void {
    // TODO: Implement edit functionality
    this.router.navigate(['/employee-form', employee.id]);
    console.log('Edit employee:', employee);
  }

  protected onDelete(employee: Employee): void {
    if (confirm(`Are you sure you want to delete employee ${employee.name}?`)) {
      this.employeeService
        .deleteEmployee(parseInt(employee.employeeCode))
        .subscribe({
          next: () => {
            this.employees = this.employees.filter(
              (emp) => emp.employeeCode !== employee.employeeCode
            );
            this.applyFilters();
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
          },
        });
    }
  }
}
