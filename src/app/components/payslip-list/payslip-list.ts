import { Component, OnInit } from '@angular/core';
import { PayslipService } from '../../services/payslip.service';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { Payslip } from '../../models/payslip.model';
import { Employee } from '../../interfaces/employee';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

interface PayslipWithEmployee extends Payslip {
  employeeName?: string;
}

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payslip-list.html',
})
export class PayslipList implements OnInit {
  payslips: PayslipWithEmployee[] = [];
  loading: boolean = false;
  error: string | null = null;
  isHR: boolean = false;
  currentEmployeeId: number | null = null;
  employeeMap: Map<number, string> = new Map();
  selectedFile: File | null = null;
  selectedPayslipId: number | null = null;

  // Add typings for error parameters
  private handleError(error: unknown): void {
    this.error = 'An error occurred. Please try again later.';
    this.loading = false;
    console.error('Error:', error);
  }

  constructor(
    private payslipService: PayslipService,
    private authService: AuthService,
    private employeeService: EmployeeService
  ) {
    this.isHR = this.authService.isHR();
    this.currentEmployeeId = this.authService.getCurrentEmployeeId();
  }

  ngOnInit(): void {
    this.loadPayslips();
  }

  loadPayslips(): void {
    this.loading = true;
    this.error = null;

    this.employeeService
      .getAllEmployees()
      .pipe(
        switchMap((employees: Employee[]) => {
          employees.forEach((emp) => {
            if (emp.id) {
              this.employeeMap.set(emp.id, emp.name);
            }
          });

          if (!this.currentEmployeeId && !this.isHR) {
            throw new Error('No employee ID available');
          }

          return this.isHR
            ? this.payslipService.getAllPayslips()
            : this.payslipService.getPayslipsByEmployeeId(
                this.currentEmployeeId!
              );
        }),
        map((payslips: Payslip[]) => {
          return payslips.map(
            (payslip) =>
              ({
                ...payslip,
                employeeName:
                  this.employeeMap.get(payslip.employeeId) || 'Unknown',
                Salary: payslip.Salary || 0,
                BaseSalary: payslip.BaseSalary || 0,
                netSalary: payslip.netSalary || 0,
              } as PayslipWithEmployee)
          );
        }),
        catchError((error: Error) => {
          this.error = 'Failed to load payslips. Please try again later.';
          this.loading = false;
          console.error('Error:', error);
          throw error;
        })
      )
      .subscribe({
        next: (processedPayslips) => {
          this.payslips = processedPayslips;
          this.loading = false;
        },
        error: (error: Error) => {
          this.handleError(error);
        },
      });
  }

  deletePayslip(id: number): void {
    if (confirm('Are you sure you want to delete this payslip?')) {
      this.loading = true;
      this.payslipService.deletePayslip(id).subscribe({
        next: () => {
          this.payslips = this.payslips.filter(
            (p: PayslipWithEmployee) => p.id !== id
          );
          this.loading = false;
        },
        error: (error: Error) => {
          this.handleError(error);
        },
      });
    }
  }

  onFileSelected(event: Event, payslipId: number): void {
    const target = event.target as HTMLInputElement;
    if (target?.files?.[0]) {
      this.selectedFile = target.files[0];
      this.selectedPayslipId = payslipId;
    }
  }

  uploadPdf(): void {
    if (this.selectedFile && this.selectedPayslipId) {
      this.loading = true;
      this.payslipService
        .uploadPayslipPdf(this.selectedPayslipId, this.selectedFile)
        .subscribe({
          next: () => {
            alert('PDF uploaded successfully');
            this.loading = false;
            this.selectedFile = null;
            this.loadPayslips(); // Refresh the list
          },
          error: (error: Error) => {
            this.handleError(error);
          },
        });
    }
  }

  downloadPdf(employeeId: number): void {
    this.loading = true;
    const id = this.isHR ? employeeId : this.currentEmployeeId;

    if (!id) {
      this.error = 'No employee ID available';
      this.loading = false;
      return;
    }

    try {
      this.payslipService.downloadPdf(id);
      this.loading = false;
    } catch (error) {
      this.handleError(error);
    }
  }
}
