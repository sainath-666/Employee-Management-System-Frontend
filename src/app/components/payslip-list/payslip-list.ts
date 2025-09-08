import { Component, OnInit } from '@angular/core';

import { PayslipService, Payslip } from '../../services/payslip.service';

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

  getCurrentMonth(): string {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  calculateNetSalary(payslip: Payslip): number {
    return (payslip.baseSalary + payslip.allowances) - payslip.deductions;
  }

  constructor(private payslipService: PayslipService) {}
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

    this.payslipService.getAllPayslips().subscribe({
      next: (data) => {
        this.payslips = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load payslips. Please try again later.';
        console.error('Load error:', err);
        this.loading = false;
      }
    });
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
        error: (error: any) => {
          this.error = 'Failed to delete payslip. Please try again later.';
          console.error('Delete error:', error);
          this.loading = false;
        }
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

  generatePdf(payslip: Payslip): void {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ccc; text-align: left; }
            th { background-color: #f8f8f8; }
          </style>
        </head>
        <body>
          <h1>Payslip for Employee #${payslip.employeeId}</h1>
          <table>
            <tr><th>Month/Year</th><td>${this.getCurrentMonth()}</td></tr>
            <tr><th>Base Salary</th><td>₹${payslip.baseSalary}</td></tr>
            <tr><th>Allowances</th><td>₹${payslip.allowances}</td></tr>
            <tr><th>Deductions</th><td>₹${payslip.deductions}</td></tr>
            <tr><th>Net Salary</th><td><strong>₹${this.calculateNetSalary(payslip)}</strong></td></tr>
          </table>
        </body>
      </html>
    `;

    this.loading = true;
    if (payslip.id === undefined) {
      this.error = 'Payslip ID is missing';
      this.loading = false;
      return;
    }
    this.payslipService.createAndGeneratePdf(payslip).subscribe({
      next: () => {
        alert('PDF generated successfully!');
        this.loadPayslips();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to generate PDF. Try again.';
        console.error('Generate PDF error:', err);
        this.loading = false;
      }
    });
  }
}
