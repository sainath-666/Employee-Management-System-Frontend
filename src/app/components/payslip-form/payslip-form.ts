import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PayslipService, Payslip } from '../../services/payslip.service';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Observable, Observer } from 'rxjs';

// Define interfaces
interface Employee {
  id: string;
  name: string;
}

interface DocumentClone extends Document {
  querySelector(selectors: string): HTMLElement | null;
}

@Component({
  selector: 'app-payslip-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './payslip-form.html',
})
export class PayslipForm implements OnInit {
  payslipForm!: FormGroup;
  isEditMode = false;
  loading = false;
  error: string | null = null;
  // Private field for employee
  private employee: Employee | null = null;
  #showPreview = false;
  #employee: Employee | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly payslipService = inject(PayslipService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {}

  private payslipId: number | null = null;

  ngOnInit(): void {
    // Initialize form immediately with default values
    this.initializeForm();

    // Check URL parameters for employee data
    this.route.queryParams.subscribe((params) => {
      if (params['employeeId'] && params['employeeName']) {
        this.#employee = {
          id: params['employeeId'],
          name: params['employeeName'],
        };
        this.updateFormWithEmployeeData();
      }
    });

    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.payslipId = parseInt(id);
      // Load existing payslip data
      this.payslipService.getPayslipById(this.payslipId).subscribe({
        next: (payslip: any) => {
          // Update the form with existing payslip data
          this.payslipForm.patchValue({
            baseSalary: payslip.baseSalary,
            allowances: payslip.allowances,
            deductions: payslip.deductions,
          });
        },
        error: (error: any) => {
          console.error('Error loading payslip:', error);
          alert('Error loading payslip data. Please try again.');
        },
      });
    }
  }

  public get showPreview(): boolean {
    return this.#showPreview;
  }

  private async fetchEmployeeData(): Promise<void> {
    // Simulated API call - replace with actual backend call
    this.#employee = {
      id: '22',
      name: 'John Doe',
    };
  }

  private updateFormWithEmployeeData(): void {
    if (this.payslipForm && this.#employee) {
      this.payslipForm.patchValue({
        name: this.#employee.name,
        empId: this.#employee.id,
      });
    }
  }

  private initializeForm(): void {
    this.payslipForm = this.fb.group({
      name: ['', { disabled: true }],
      empId: ['', { disabled: true }],
      baseSalary: [
        0,
        [
          Validators.required,
          Validators.min(0.01),
          Validators.pattern(/^\d+$/),
        ],
      ],
      allowances: [
        0,
        [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)],
      ],
      deductions: [
        0,
        [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)],
      ],
    });
  }

  public calculateNetSalary(): number {
    if (!this.payslipForm) {
      return 0;
    }

    const values = this.payslipForm.getRawValue();
    return (
      (values.baseSalary || 0) +
      (values.allowances || 0) -
      (values.deductions || 0)
    );
  }

  public getCurrentDate(): string {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  public togglePreview(): void {
    this.#showPreview = !this.#showPreview;
  }

  public generatePDF(): void {
    if (!this.payslipForm.valid) {
      const errors = Object.keys(this.payslipForm.controls)
        .filter((key) => this.payslipForm.controls[key].errors)
        .map(
          (key) =>
            `${key}: ${JSON.stringify(this.payslipForm.controls[key].errors)}`
        );
      console.error('Form validation errors:', errors);
      alert('Form is not valid. Please check all fields.');
      return;
    }

    // Get the raw form values including disabled fields
    const formValues = this.payslipForm.getRawValue();
    console.log('Form values:', formValues);

    // Log detailed validation state
    console.log('Form validation state:', {
      isValid: this.payslipForm.valid,
      errors: this.payslipForm.errors,
      controls: Object.keys(this.payslipForm.controls).reduce(
        (acc: any, key: string) => {
          acc[key] = {
            value: this.payslipForm.get(key)?.value,
            valid: this.payslipForm.get(key)?.valid,
            errors: this.payslipForm.get(key)?.errors,
            touched: this.payslipForm.get(key)?.touched,
            dirty: this.payslipForm.get(key)?.dirty,
          };
          return acc;
        },
        {}
      ),
    });

    // Validate all required number fields exist
    const requiredNumericFields = ['baseSalary', 'allowances', 'deductions'];
    for (const field of requiredNumericFields) {
      if (
        formValues[field] === null ||
        formValues[field] === undefined ||
        isNaN(Number(formValues[field]))
      ) {
        alert(`${field} must be a valid number`);
        return;
      }
    }

    // Make sure all required values are present
    if (!formValues.empId) {
      alert('Employee ID is required');
      return;
    }

    // Use the employee ID from the form and ensure it's a valid number
    const employeeId = Math.abs(Math.round(Number(formValues.empId)));

    // Validate employee ID is a positive number
    if (isNaN(employeeId) || employeeId <= 0) {
      alert('Employee ID must be a positive number');
      return;
    }

    // Validate and convert all numeric fields with rounding
    const baseSalary = Math.round(Math.abs(Number(formValues.baseSalary)));
    const allowances = Math.round(Math.abs(Number(formValues.allowances)));
    const deductions = Math.round(Math.abs(Number(formValues.deductions)));

    // Log the values for debugging
    console.log('Form Values:', {
      employeeId,
      baseSalary,
      allowances,
      deductions,
    });

    // Validate numeric values
    if ([baseSalary, allowances, deductions].some(isNaN)) {
      alert(
        'Invalid numeric values in form. Please ensure all numbers are valid.'
      );
      return;
    }

    // Validate base salary is greater than 0
    if (baseSalary <= 0) {
      alert('Base salary must be greater than 0');
      return;
    }

    // Store rounded values
    const roundedBaseSalary = baseSalary;
    const roundedAllowances = allowances;
    const roundedDeductions = deductions;

    // Validate according to server constraints
    if (roundedBaseSalary <= 0) {
      alert('Base salary must be greater than 0');
      return;
    }

    if (roundedDeductions < 0) {
      alert('Deductions cannot be negative');
      return;
    }

    // Create payslip data with all required fields
    const currentDate = new Date();
    const calculatedNetSalary =
      roundedBaseSalary + roundedAllowances - roundedDeductions;

    // Final validation
    if (calculatedNetSalary < 0) {
      alert('Net salary cannot be negative. Please check deductions.');
      return;
    }

    const payslipData = {
      employeeId,
      baseSalary: roundedBaseSalary,
      allowances: roundedAllowances,
      deductions: roundedDeductions,
      createdBy: 22, // HR ID
      month: currentDate.toLocaleString('default', { month: 'long' }),
      year: currentDate.getFullYear(),
      netSalary: calculatedNetSalary,
    } as const;

    // Additional validations
    if (roundedBaseSalary <= 0) {
      alert('Base salary must be greater than 0');
      return;
    }

    if (employeeId <= 0) {
      alert('Employee ID must be a positive number');
      return;
    }

    // Log the final payload for debugging
    console.log('Payslip Payload:', payslipData);

    // Call the endpoint to create the payslip
    this.loading = true;

    // Log the exact data being sent
    console.log(
      'Sending payslip data to server:',
      JSON.stringify(payslipData, null, 2)
    );

    const observer: Observer<any> = {
      next: (response) => {
        console.log('Server response:', response);
        alert('Payslip generated successfully!');
        void this.router.navigate(['/payslips']);
      },
      error: (error: any) => {
        console.error('Full error object:', error);

        let errorMessage: string;
        if (error instanceof Error) {
          // Direct error message from our service
          errorMessage = 'Error generating payslip: ' + error.message;
        } else if (error.status === 0) {
          errorMessage =
            'Error generating payslip: Cannot connect to server. Is the backend running?';
        } else if (error.status === 400) {
          const validationErrors =
            error.error?.errors ||
            error.error?.message ||
            'Invalid payslip data';
          if (typeof validationErrors === 'object') {
            errorMessage =
              'Error generating payslip: ' +
              Object.values(validationErrors).join('\n');
          } else {
            errorMessage = 'Error generating payslip: ' + validationErrors;
          }
        } else if (error.status === 401) {
          errorMessage = 'Error generating payslip: Please log in again.';
        } else if (error.error?.message) {
          errorMessage = 'Error generating payslip: ' + error.error.message;
        } else {
          errorMessage =
            'Error generating payslip: An unexpected error occurred. Please try again.';
        }

        // Log the full error context
        console.error('Error context:', {
          errorMessage,
          originalError: error,
          formValues: this.payslipForm?.value,
        });

        alert(errorMessage);
      },
      complete: () => {
        this.loading = false;
        console.log('Request completed');
      },
    };

    this.payslipService.createPayslip(payslipData).subscribe(observer);
  }
}
