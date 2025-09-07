import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Router } from '@angular/router';

interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  mobileNumber: string;
  profilePhoto: string;
  role: string;
  status: string;
  gender: string;
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

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  viewEmployee(id: number): void {
    this.router.navigate(['/employee-view'], {
      queryParams: { id: id },
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees = data.map((emp) => ({
          id: emp.id,
          employeeCode: emp.employeeCode,
          name: emp.name,
          email: emp.email,
          mobileNumber: emp.mobileNumber,
          profilePhoto: emp.profilePhoto || 'assets/images/default-user.png',
          role: emp.role,
          status: emp.status,
          gender: emp.gender,
        }));
        this.applyFilters(); // Apply initial filters
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
      },
    });
  }

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
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.role === this.roleFilter);
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
