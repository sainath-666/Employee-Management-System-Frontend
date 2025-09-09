import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
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
  month?: string;
  status?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PayslipService {
  private apiUrl = `${environment.apiUrl}/api/Payslips`;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    withCredentials: true, // Send cookies if needed
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
    console.log('Fetching payslips from:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl, this.httpOptions).pipe(
      map((response) => {
        console.log('Raw API response:', response);
        if (!Array.isArray(response)) {
          console.error('Expected array response but got:', typeof response);
          return [];
        }

        // Transform and validate each payslip
        return response.map((item) => ({
          id: item.id,
          employeeId: Number(item.employeeId),
          baseSalary: Number(item.baseSalary || 0),
          allowances: Number(item.allowances || 0),
          deductions: Number(item.deductions || 0),
          createdBy: Number(item.createdBy || 0),
          pdfPath: item.pdfPath
        }));
      }),
      retry(1),
      catchError((err) => {
        console.error('Error fetching payslips:', err);
        return this.handleError(err);
      })
    );
  }

  getPayslipById(id: number): Observable<Payslip> {
    return this.http
      .get<Payslip>(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError));
  }

  // Get payslips by employee ID
  getPayslipsByEmployeeId(employeeId: number): Observable<Payslip[]> {
    console.log('Fetching payslips for employee:', employeeId);
    return this.getAllPayslips().pipe(
      map((payslips) => payslips.filter((p) => p.employeeId === employeeId))
    );
  }

  // Create new payslip and generate PDF
  createAndGeneratePdf(payslipData: {
    employeeId: number;
    baseSalary: number;
    allowances: number;
    deductions: number;
    createdBy: number;
  }): Observable<any> {
    const payload = {
      employeeId: payslipData.employeeId,
      baseSalary: payslipData.baseSalary,
      allowances: payslipData.allowances,
      deductions: payslipData.deductions,
      createdBy: payslipData.createdBy
    };

    console.log('Creating payslip with payload:', payload);

    return this.http
      .post(`${this.apiUrl}/payslip-data`, payload, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      })
      .pipe(
        map(response => {
          console.log('Create payslip response:', response);
          return response;
        }),
        catchError(error => {
          console.error('Create payslip error:', error);
          return throwError(() => error);
        })
      );
  }

  // Update payslip using the main API endpoint
  updatePayslip(id: number, payslip: {
    employeeId: number;
    baseSalary: number;
    allowances: number;
    deductions: number;
    createdBy: number;
    month?: string;
    status?: boolean;
  }): Observable<any> {
    console.log('Update payslip data:', { id, payslip });
    const baseSalary = Number(payslip.baseSalary) || 0;
    const allowances = Number(payslip.allowances) || 0;
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    
    const payload = {
      employeeId: payslip.employeeId,
      salary: baseSalary + allowances, // Calculate salary as sum of baseSalary and allowances
      baseSalary: baseSalary,
      allowances: allowances,
      deductions: payslip.deductions,
      createdBy: 22,
      month: payslip.month || currentMonth,
      status: true
    };

    console.log('Updating payslip with data:', payload);

    return this.http
      .put(`${this.apiUrl}/${id}`, payload, this.httpOptions)
      .pipe(
        map((response) => {
          console.log('Update response:', response);
          if (!response) {
            throw new Error('Empty response from server');
          }
          return response;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Payslip update failed:', error);
          console.error('Status:', error.status);
          console.error('Status Text:', error.statusText);
          console.error('Error body:', error.error);
          console.error('Payload sent:', payload);

          let errorMessage = '';
          if (error.status === 500) {
            errorMessage =
              'Server error. Please check if all values are valid.';
            console.error('Detailed server error:', {
              error: error.error,
              message: error.message,
              name: error.name,
              statusText: error.statusText,
            });
          } else {
            errorMessage =
              error.error?.message ||
              error.message ||
              'An unexpected error occurred';
          }

          return throwError(() => ({
            status: error.status,
            message: errorMessage,
            error: error.error,
          }));
        })
      );
  }

  deletePayslip(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  uploadPayslipPdf(payslipId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post(`${this.apiUrl}/${payslipId}/upload`, formData)
      .pipe(catchError(this.handleError));
  }

  // Generate PDF for a payslip
  generatePdf(id: number): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/${id}/generate-pdf`, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Generate PDFs for selected payslips
  generateSelectedPayslipsPdf(payload: { employeeIds: number[], createdBy: number }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log('Sending payload:', payload); // Debug log
    
    return this.http
      .put(`${this.apiUrl}/update-and-generate-pdf-bulk`, payload, { headers, withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error in generateSelectedPayslipsPdf:', error);
          return throwError(() => error);
        })
      );
  }

  // Download PDF for a payslip
  downloadPayslipPdf(employeeId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-latest/${employeeId}`, {
      responseType: 'blob',
    });
  }

  // Helper method to handle PDF download
  downloadPdf(employeeId: number): void {
    this.downloadPayslipPdf(employeeId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslip_${employeeId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        alert('Failed to download payslip PDF. Please try again later.');
      },
    });
  }
}
