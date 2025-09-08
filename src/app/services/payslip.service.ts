import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Payslip {
  id?: number;
  employeeId: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  createdBy: number;
  pdfPath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayslipService {
  private apiUrl = `${environment.apiUrl}/api/Payslips`;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let message = 'An unexpected error occurred';
    
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 0) {
      message = 'Cannot connect to server';
    } else if (error.status === 400) {
      message = 'Invalid data submitted';
    } else if (error.status === 404) {
      message = 'API endpoint not found';
    }
    
    return throwError(() => new Error(message));
  }

  getAllPayslips(): Observable<Payslip[]> {
    return this.http.get<Payslip[]>(this.apiUrl, this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getPayslipById(id: number): Observable<Payslip> {
    return this.http.get<Payslip>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createAndGeneratePdf(payslipData: Payslip): Observable<any> {
    const payload = {
      employeeId: payslipData.employeeId,
      baseSalary: payslipData.baseSalary,
      allowances: payslipData.allowances,
      deductions: payslipData.deductions,
      createdBy: 22
    };

    console.log('Sending payload:', payload);

    return this.http.post<any>(`${this.apiUrl}/create-and-generate-pdf`, payload, this.httpOptions).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  deletePayslip(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  uploadPayslipPdf(payslipId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/${payslipId}/upload`, formData).pipe(
      catchError(this.handleError)
    );
  }

  downloadPdf(id: number): void {
    window.open(`${this.apiUrl}/${id}/download`, '_blank');
  }
}
