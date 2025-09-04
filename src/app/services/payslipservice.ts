import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Optional model
export interface Payslip {
  id: number;
  employeeId: number;
  salary: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;         // comes from DB (read-only)
  month?: string;            // nullable → optional
  status: boolean;
  createdBy?: number;
  createdDateTime: string;   // DateTime → string (ISO format)
  updatedBy?: number;
  updatedDateTime?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PayslipService {
  private baseUrl = 'https://localhost:7056/api/Payslips'; // adjust backend URL if needed

  constructor(private http: HttpClient) {}

  // 🔹 Get all payslips
  getAllPayslips(): Observable<Payslip[]> {
    return this.http.get<Payslip[]>(`${this.baseUrl}`);
  }

  // 🔹 Get payslip by ID
  getPayslipById(id: number): Observable<Payslip> {
    return this.http.get<Payslip>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Create payslip
  addPayslip(payslip: Payslip): Observable<any> {
    return this.http.post(`${this.baseUrl}`, payslip);
  }

  // 🔹 Update payslip
  updatePayslip(id: number, payslip: Payslip): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, payslip);
  }

  // 🔹 Delete payslip
  deletePayslip(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // 🔹 Upload PDF for a payslip
  uploadPdf(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.baseUrl}/${id}/upload-pdf`, formData);
  }

  // 🔹 Download PDF for a payslip
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/download-pdf`, {
      responseType: 'blob', // important for file download
    });
  }
}
