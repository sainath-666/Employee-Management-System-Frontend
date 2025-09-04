import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Employee {
  empId: string;
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
  Math = Math; // Add Math object to use in template
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  statusFilter: string = 'all';
  roleFilter: string = 'all';
  genderFilter: string = 'all';

  ngOnInit() {
    // Mock data - Replace this with actual API call
    this.employees = [
      {
        empId: 'EMP001',
        name: 'John Doe',
        email: 'john.doe@company.com',
        mobileNumber: '1234567890',
        profilePhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
        role: 'Senior Developer',
        status: 'Active',
        gender: 'Male',
      },
      {
        empId: 'EMP002',
        name: 'Sarah Johnson',
        email: 'sarah.j@company.com',
        mobileNumber: '9876543210',
        profilePhoto: 'https://randomuser.me/api/portraits/women/2.jpg',
        role: 'Project Manager',
        status: 'Active',
        gender: 'Female',
      },
      {
        empId: 'EMP003',
        name: 'Michael Chen',
        email: 'michael.c@company.com',
        mobileNumber: '5554443333',
        profilePhoto: 'https://randomuser.me/api/portraits/men/3.jpg',
        role: 'Full Stack Developer',
        status: 'Active',
        gender: 'Male',
      },
      {
        empId: 'EMP004',
        name: 'Emily Rodriguez',
        email: 'emily.r@company.com',
        mobileNumber: '7778889999',
        profilePhoto: 'https://randomuser.me/api/portraits/women/4.jpg',
        role: 'HR Manager',
        status: 'Active',
        gender: 'Female',
      },
      {
        empId: 'EMP005',
        name: 'Alex Turner',
        email: 'alex.t@company.com',
        mobileNumber: '3332221111',
        profilePhoto: 'https://randomuser.me/api/portraits/men/5.jpg',
        role: 'UI/UX Designer',
        status: 'Inactive',
        gender: 'Other',
      },
      {
        empId: 'EMP006',
        name: 'Lisa Wang',
        email: 'lisa.w@company.com',
        mobileNumber: '4445556666',
        profilePhoto: 'https://randomuser.me/api/portraits/women/6.jpg',
        role: 'QA Engineer',
        status: 'Active',
        gender: 'Female',
      },
      {
        empId: 'EMP007',
        name: 'James Wilson',
        email: 'james.w@company.com',
        mobileNumber: '6667778888',
        profilePhoto: 'https://randomuser.me/api/portraits/men/7.jpg',
        role: 'DevOps Engineer',
        status: 'Inactive',
        gender: 'Male',
      },
      {
        empId: 'EMP008',
        name: 'Maria Garcia',
        email: 'maria.g@company.com',
        mobileNumber: '8889990000',
        profilePhoto: 'https://randomuser.me/api/portraits/women/8.jpg',
        role: 'Backend Developer',
        status: 'Active',
        gender: 'Female',
      },
      {
        empId: 'EMP009',
        name: 'David Kim',
        email: 'david.k@company.com',
        mobileNumber: '2223334444',
        profilePhoto: 'https://randomuser.me/api/portraits/men/9.jpg',
        role: 'System Administrator',
        status: 'Active',
        gender: 'Male',
      },
      {
        empId: 'EMP010',
        name: 'Rachel Smith',
        email: 'rachel.s@company.com',
        mobileNumber: '1112223333',
        profilePhoto: 'https://randomuser.me/api/portraits/women/10.jpg',
        role: 'Product Manager',
        status: 'Inactive',
        gender: 'Female',
      },
    ];
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.employees];

    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.empId.toLowerCase().includes(query)
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

  get totalPages(): number {
    return Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
  }

  get paginatedEmployees(): Employee[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredEmployees.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onView(employee: Employee) {
    // TODO: Implement view functionality
    console.log('View employee:', employee);
  }

  onEdit(employee: Employee) {
    // TODO: Implement edit functionality
    console.log('Edit employee:', employee);
  }

  onDelete(employee: Employee) {
    if (confirm(`Are you sure you want to delete employee ${employee.name}?`)) {
      // TODO: Implement actual API call to delete
      this.employees = this.employees.filter(
        (emp) => emp.empId !== employee.empId
      );
      this.applyFilters();
    }
  }
}
