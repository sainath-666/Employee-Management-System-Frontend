import { Component, OnInit } from '@angular/core';
import { PayslipService } from '../../services/payslip.service';
import { Payslip } from '../../models/payslip.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payslip-list.html'
})
export class PayslipList implements OnInit {
  payslips: Payslip[] = [];
  loading: boolean = false;
  error: string | null = null;
  selectedFile: File | null = null;
  selectedPayslipId: number | null = null;

  constructor(private payslipService: PayslipService) {}

  ngOnInit(): void {
    this.loadPayslips();
  }

  loadPayslips(): void {
    this.loading = true;
    this.error = null;

    this.payslipService.getAllPayslips().subscribe({
      next: (data) => {
        console.log('Raw data from server:', data);
        // Transform the data if needed
        this.payslips = data.map(payslip => ({
          ...payslip,
          // Ensure numeric fields have default values if they're null/undefined
          Salary: payslip.Salary || 0,
          BaseSalary: payslip.BaseSalary || 0,
          netSalary: payslip.netSalary || 0
        }));
        // Log each payslip after transformation
        this.payslips.forEach((payslip, index) => {
          console.log(`Transformed Payslip ${index + 1}:`, {
            id: payslip.id,
            employeeId: payslip.employeeId,
            Salary: payslip.Salary,
            BaseSalary: payslip.BaseSalary,
            netSalary: payslip.netSalary
          });
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load payslips. Please try again later.';
        this.loading = false;
        console.error('Error:', err);
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
        error: (err) => {
          this.error = 'Failed to delete payslip. Please try again later.';
          this.loading = false;
          console.error('Error:', err);
        }
      });
    }
  }

  onFileSelected(event: Event, payslipId: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.selectedPayslipId = payslipId;
    }
  }

  uploadPdf(): void {
    if (this.selectedFile && this.selectedPayslipId) {
      this.loading = true;
      this.payslipService.uploadPayslipPdf(this.selectedPayslipId, this.selectedFile).subscribe({
        next: () => {
          alert('PDF uploaded successfully');
          this.loading = false;
          this.selectedFile = null;
          this.loadPayslips(); // Refresh the list
        },
        error: (err) => {
          this.error = 'Failed to upload PDF. Please try again later.';
          this.loading = false;
          console.error('Error:', err);
        }
      });
    }
  }

  downloadPdf(id: number): void {
    this.loading = true;
    this.payslipService.downloadPdf(id);
    this.loading = false;
  }
}
