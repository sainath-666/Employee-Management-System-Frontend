import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';

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
  status?: boolean;
  departments?: any[];
}

@Component({
  selector: 'app-employee-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-view.html',
})
export class EmployeeViewComponent implements OnInit {
  employee: Employee | null = null;

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadEmployeeDetails(Number(id));
      }
    });
  }

  loadEmployeeDetails(id: number): void {
    this.employeeService.getEmployeeById(id).subscribe({
      next: (data: Employee) => {
        this.employee = data;
      },
      error: (error: any) => {
        console.error('Error fetching employee details:', error);
      },
    });
  }
}
