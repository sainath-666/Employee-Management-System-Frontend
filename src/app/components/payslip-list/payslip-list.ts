import { Component, OnInit } from '@angular/core';
import { PayslipService, Payslip } from '../../services/payslip.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payslip-list.html'
})
export class PayslipListComponent implements OnInit {
  payslips: Payslip[] = [];
  loading: boolean = false;
  error: string | null = null;
  selectedFile: File | null = null;
  selectedPayslipId: number | null = null;

  getCurrentMonth(): string {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  calculateNetSalary(payslip: Payslip): number {
    return (payslip.baseSalary + payslip.allowances) - payslip.deductions;
  }

  constructor(private payslipService: PayslipService) {}

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
  }

  deletePayslip(id: number): void {
    if (confirm('Are you sure you want to delete this payslip?')) {
      this.loading = true;
      this.payslipService.deletePayslip(id).subscribe({
        next: () => {
          this.payslips = this.payslips.filter(p => p.id !== id);
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to delete payslip. Please try again later.';
          console.error('Delete error:', error);
          this.loading = false;
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
          this.selectedFile = null;
          this.loadPayslips();
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to upload PDF.';
          console.error('Upload error:', error);
          this.loading = false;
        }
      });
    }
  }

  downloadPdf(id: number): void {
    this.loading = true;
    this.payslipService.downloadPdf(id);
    this.loading = false;
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
