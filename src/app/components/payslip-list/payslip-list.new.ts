import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PayslipService } from '../../services/payslip.service';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../interfaces/employee';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Payslip } from '../../services/payslip.service';

interface PayslipWithEmployee extends Omit<Payslip, 'month' | 'year' | 'netSalary'> {
  employeeName?: string;
  month: string;
  year: number;
  netSalary: number;
}

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payslip-list.html',
})
export class PayslipListComponent implements OnInit {
  payslips: PayslipWithEmployee[] = [];
  selectedPayslips: Set<number> = new Set();
  selectAll: boolean = false;
  loading: boolean = false;
  error: string | null = null;
  isHR: boolean = false;
  currentEmployeeId: number | null = null;
  employeeMap: Map<number, string> = new Map();
  selectedFile: File | null = null;
  selectedPayslipId: number | null = null;

  constructor(
    private payslipService: PayslipService,
    public authService: AuthService,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.isHR = this.authService.isHR();
    this.currentEmployeeId = this.authService.getCurrentEmployeeId();
  }

  ngOnInit(): void {
    this.loadPayslips();
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.payslips.forEach(payslip => {
        if (payslip.id) {
          this.selectedPayslips.add(payslip.id);
        }
      });
    } else {
      this.selectedPayslips.clear();
    }
  }

  toggleSelectPayslip(payslipId: number): void {
    if (this.selectedPayslips.has(payslipId)) {
      this.selectedPayslips.delete(payslipId);
    } else {
      this.selectedPayslips.add(payslipId);
    }
  }

  generateSelectedPayslips(): void {
    if (this.selectedPayslips.size === 0) {
      this.error = 'Please select at least one payslip to generate';
      return;
    }

    this.loading = true;
    const selectedEmployeeIds = this.payslips
      .filter(p => this.selectedPayslips.has(p.id || 0))
      .map(p => p.employeeId);

    const payload = {
      employeeIds: selectedEmployeeIds,
      createdBy: this.authService.getCurrentEmployeeId() || 22
    };

    console.log('Sending data:', payload);

    this.payslipService.generateSelectedPayslipsPdf(payload).subscribe({
      next: (response) => {
        console.log('Success response:', response);
        alert('All selected payslips have been generated successfully!');
        this.selectedPayslips.clear();
        this.loadPayslips();
        this.loading = false;
      },
      error: (err) => {
        console.error('Full error details:', err);
        let errorMessage = 'Failed to generate payslips. ';
        if (err.status === 405) {
          errorMessage += 'The API endpoint does not support this operation.';
        } else if (err.error?.message) {
          errorMessage += err.error.message;
        } else if (err.message) {
          errorMessage += err.message;
        }
        this.error = errorMessage;
        this.loading = false;
      }
    });
  }

  private handleError(error: unknown): void {
    this.error = 'An error occurred. Please try again later.';
    this.loading = false;
    console.error('Error:', error);
  }

  loadPayslips(): void {
    this.loading = true;
    this.error = null;

    this.employeeService.getAllEmployees().subscribe({
      next: (employees) => {
        this.employeeMap.clear();
        employees.forEach(emp => {
          if (emp.id) {
            this.employeeMap.set(emp.id, emp.name);
          }
        });

        const payslipsObservable = this.isHR
          ? this.payslipService.getAllPayslips()
          : this.payslipService.getPayslipsByEmployeeId(this.currentEmployeeId!);

        payslipsObservable.subscribe({
          next: (data) => {
            const currentDate = new Date();
            this.payslips = data.map(payslip => ({
              ...payslip,
              month: currentDate.toLocaleString('default', { month: 'long' }),
              year: currentDate.getFullYear(),
              netSalary: payslip.baseSalary + payslip.allowances - payslip.deductions,
              employeeName: this.employeeMap.get(payslip.employeeId) || 'Unknown'
            }));
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load payslips. Please try again later.';
            console.error('Load error:', err);
            this.loading = false;
          },
        });
      },
      error: (err) => {
        this.error = 'Failed to load employee data. Please try again later.';
        console.error('Employee load error:', err);
        this.loading = false;
      }
    });
  }

  deletePayslip(id: number): void {
    if (confirm('Are you sure you want to delete this payslip?')) {
      this.loading = true;
      this.payslipService.deletePayslip(id).subscribe({
        next: () => {
          this.payslips = this.payslips.filter(p => p.id !== id);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to delete payslip. Please try again later.';
          console.error('Delete error:', error);
          this.loading = false;
          this.handleError(error);
        },
      });
    }
  }

  updatePayslip(payslip: PayslipWithEmployee): void {
    const employeeName = this.employeeMap.get(payslip.employeeId) || payslip.employeeName;
    this.router.navigate(['/payslip-form'], {
      queryParams: {
        payslipId: payslip.id,
        employeeId: payslip.employeeId,
        employeeName: employeeName
      }
    });
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

  getCurrentMonth(): string {
    return new Date().toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }
}
