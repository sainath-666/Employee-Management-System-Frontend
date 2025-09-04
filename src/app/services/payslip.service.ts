import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { Payslip } from '../models/payslip.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayslipService {
  private apiUrl = `${environment.apiUrl}/api/Payslips`; // Updated to match the exact URL case

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }),
    withCredentials: true // Send cookies if needed
  };

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // Get all payslips
  getAllPayslips(): Observable<Payslip[]> {
    console.log('Fetching payslips from:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl, this.httpOptions)
      .pipe(
        map(response => {
          console.log('Raw API response:', response);
          if (!Array.isArray(response)) {
            console.error('Expected array response but got:', typeof response);
            return [];
          }
          
          // Transform and validate each payslip
          const payslips = response.map(item => {
            const payslip: Payslip = {
              id: item.id,
              employeeId: Number(item.employeeId),
              month: item.month,
              year: Number(item.year),
              Salary: Number(item.salary || item.Salary || 0),
              BaseSalary: Number(item.baseSalary || item.BaseSalary || 0),
              allowances: Number(item.allowances || 0),
              deductions: Number(item.deductions || 0),
              netSalary: Number(item.netSalary || 0),
              pdfPath: item.pdfPath
            };
            
            // Add createdBy if it exists
            if (item.createdBy) {
              payslip.createdBy = Number(item.createdBy);
            }
            
            return payslip;
          });

          console.log('Transformed payslips:', payslips);
          return payslips;
        }),
        retry(1),
        catchError(err => {
          console.error('Error fetching payslips:', err);
          return this.handleError(err);
        })
      );
  }

  // Get payslip by ID
  getPayslipById(id: number): Observable<Payslip> {
    return this.http.get<Payslip>(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // Create new payslip
  createPayslip(payslip: Payslip): Observable<Payslip> {
    // Create a deep copy of the payslip data to ensure clean data
    const cleanPayslip = {
      ...payslip,
      employeeId: Number(payslip.employeeId),
      BaseSalary: Number(payslip.BaseSalary || 0),
      allowances: Number(payslip.allowances || 0),
      deductions: Number(payslip.deductions || 0),
      netSalary: Number(payslip.netSalary || 0),
      year: Number(payslip.year)
    };

    // Log the values to verify
    console.log('Clean payslip data:', {
      ...cleanPayslip,
      originalBaseSalary: payslip.BaseSalary,
      convertedBaseSalary: cleanPayslip.BaseSalary
    });

    console.log('Creating payslip with data:', cleanPayslip);
    
    return this.http.post<Payslip>(this.apiUrl, cleanPayslip, this.httpOptions).pipe(
      map(response => {
        console.log('Server response:', response);
        if (!response) {
          throw new Error('Empty response from server');
        }
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Payslip creation failed:', error);
        console.error('Status:', error.status);
        console.error('Status Text:', error.statusText);
        console.error('Error body:', error.error);
        console.error('Payload sent:', cleanPayslip);

        let errorMessage = '';
        if (error.status === 500) {
          errorMessage = 'Server error. Please check if the employee ID exists and all values are valid.';
          // Log detailed error for debugging
          console.error('Detailed server error:', {
            error: error.error,
            message: error.message,
            name: error.name,
            statusText: error.statusText
          });
        } else {
          errorMessage = error.error?.message || error.message || 'An unexpected error occurred';
        }

        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          error: error.error
        }));
      })
    );
  }

  // Update payslip
  updatePayslip(id: number, payslip: Payslip): Observable<Payslip> {
    // Create a deep copy of the payslip data to ensure clean data
    const cleanPayslip = {
      ...payslip,
      employeeId: Number(payslip.employeeId),
      BaseSalary: Number(payslip.BaseSalary || 0),
      Salary: Number(payslip.Salary || 0),
      allowances: Number(payslip.allowances || 0),
      deductions: Number(payslip.deductions || 0),
      netSalary: Number(payslip.netSalary || 0),
      year: Number(payslip.year),
      createdBy: Number(payslip.createdBy)
    };

    console.log('Updating payslip with data:', cleanPayslip);
    
    return this.http.put<Payslip>(`${this.apiUrl}/${id}`, cleanPayslip, this.httpOptions)
      .pipe(
        map(response => {
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
          console.error('Payload sent:', cleanPayslip);

          let errorMessage = '';
          if (error.status === 500) {
            errorMessage = 'Server error. Please check if all values are valid.';
            console.error('Detailed server error:', {
              error: error.error,
              message: error.message,
              name: error.name,
              statusText: error.statusText
            });
          } else {
            errorMessage = error.error?.message || error.message || 'An unexpected error occurred';
          }

          return throwError(() => ({
            status: error.status,
            message: errorMessage,
            error: error.error
          }));
        })
      );
  }

  // Delete payslip
  deletePayslip(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Upload PDF for a payslip
  uploadPayslipPdf(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const uploadOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    };

    return this.http.post(`${this.apiUrl}/${id}/upload-pdf`, formData, uploadOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Download PDF for a payslip
  downloadPayslipPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download-pdf`, {
      responseType: 'blob'
    });
  }

  // Helper method to handle PDF download
  downloadPdf(id: number): void {
    this.downloadPayslipPdf(id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
