import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
    private employeeService: EmployeeService,
    private location:Location,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadEmployeeDetails(Number(id));
      }
    });
  }

  goBack(): void {
    this.location.back();  // 🔹 Goes to previous page in history
  }

  editEmployee(employeeId?: number) {
  if (employeeId !== undefined) {
    this.router.navigate(['/employee-form',employeeId]);
  }
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
