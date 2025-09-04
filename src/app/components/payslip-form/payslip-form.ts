import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PayslipService } from '../../services/payslip.service';
import { Payslip } from '../../models/payslip.model';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Define interfaces
interface Employee {
  id: string;
  name: string;
  // Add other employee properties as needed
}

interface DocumentClone extends Document {
  querySelector(selectors: string): HTMLElement | null;
}

@Component({
  selector: 'app-payslip-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './payslip-form.html'
})
export class PayslipForm implements OnInit {
  payslipForm!: FormGroup; // Using definite assignment assertion
  isEditMode: boolean = false;
  loading: boolean = false;
  error: string | null = null;
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Private field for employee
  private employee: Employee | null = null;
  #showPreview = false;
  #currentDate: Date;
  #payPeriod: string;
  #employee: Employee | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly payslipService: PayslipService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.#currentDate = new Date();
    this.#payPeriod = this.getCurrentPayPeriod();
    // Initialize employee data
    this.#employee = {
      id: '22',
      name: 'John Doe'
    };
  }

  private payslipId: number | null = null;

  ngOnInit(): void {
    // Initialize form immediately with default values
    this.initializeForm();

    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.payslipId = parseInt(id);
      // Load existing payslip data
      this.payslipService.getPayslipById(this.payslipId).subscribe({
        next: (payslip) => {
          // Update the form with existing payslip data
          this.payslipForm.patchValue({
            name: 'John Doe', // Since this is fixed for now
            empId: payslip.employeeId,
            salary: payslip.Salary,
            BaseSalary: payslip.BaseSalary,
            allowances: payslip.allowances,
            deductions: payslip.deductions
          });
        },
        error: (error) => {
          console.error('Error loading payslip:', error);
          alert('Error loading payslip data. Please try again.');
        }
      });
    } else {
      // Then fetch employee data for new payslip
      this.fetchEmployeeData().then(() => {
        this.updateFormWithEmployeeData();
      });
    }
  }

  public get showPreview(): boolean {
    return this.#showPreview;
  }

  public get currentPayPeriod(): string {
    return this.#payPeriod;
  }

  private getCurrentPayPeriod(): string {
    return this.#currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  private async fetchEmployeeData(): Promise<void> {
    // Simulated API call - replace with actual backend call
    this.#employee = {
      id: '22',
      name: 'John Doe'
    };
  }

  private updateFormWithEmployeeData(): void {
    if (this.payslipForm && this.#employee) {
      this.payslipForm.patchValue({
        name: this.#employee.name,
        empId: this.#employee.id,
        payPeriod: this.#payPeriod
      });
    }
  }

  private initializeForm(): void {
    this.payslipForm = this.fb.group({
      name: ['John Doe', { disabled: true }],
      empId: ['22', { disabled: true }],
      payPeriod: [this.#payPeriod, { disabled: true }],
      salary: [0, [Validators.required, Validators.min(1)]],  // Total salary including allowances
      BaseSalary: [0, [Validators.required, Validators.min(1)]],
      allowances: [0, [Validators.required, Validators.min(0)]],
      deductions: [0, [Validators.required, Validators.min(0)]]
    });

    // Subscribe to changes in salary to update BaseSalary and allowances
    this.payslipForm.get('salary')?.valueChanges.subscribe(value => {
      if (value) {
        const salary = Number(value);
        // Base salary will be 80% of total salary, allowances 20%
        const baseSalary = Math.round(salary * 0.8);
        const allowances = salary - baseSalary;
        
        this.payslipForm.patchValue({
          BaseSalary: baseSalary,
          allowances: allowances
        }, { emitEvent: false });
      }
    });

    // Set the employee data
    this.#employee = {
      id: '22',
      name: 'John Doe'
    };
    this.updateFormWithEmployeeData();
  }

  public updatePayslipPeriod(): void {
    this.#currentDate = new Date();
    this.#payPeriod = this.getCurrentPayPeriod();
    this.payslipForm.patchValue({
      payPeriod: this.#payPeriod
    }, { emitEvent: false });
  }

  public calculateNetSalary(): number {
    if (!this.payslipForm) {
      return 0;
    }

    const values = this.payslipForm.getRawValue();
    // Net salary is now calculated from the total salary minus deductions
    return (values.salary || 0) - (values.deductions || 0);
  }

  public togglePreview(): void {
    this.#showPreview = !this.#showPreview;
  }

  public async generatePDF(): Promise<void> {
    if (!this.payslipForm.valid) {
      console.error('Form is not valid');
      return;
    }

    try {
      // Always show preview first
      this.#showPreview = true;
      
      // Wait for the preview to render in the next change detection cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const payslip = document.getElementById('payslip-preview');
      if (!payslip) {
        throw new Error('Preview element not found. Please try again.');
      }

      // Generate PDF
      const canvas = await html2canvas(payslip, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Force all colors to be in hex format in the cloned document
          const clonedElement = clonedDoc.getElementById('payslip-preview');
          if (clonedElement) {
            const elements = clonedElement.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const element = elements[i] as HTMLElement;
              const style = window.getComputedStyle(element);
              element.style.color = style.color;
              element.style.backgroundColor = style.backgroundColor;
              element.style.borderColor = style.borderColor;
            }
          }
        }
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add the image
      pdf.addImage(
        canvas.toDataURL('image/png', 1.0),
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      // First, create a payslip record in the database
      const [month, year] = this.#payPeriod.split(' ');
      
      // Get the raw form values including disabled fields
      const formValues = this.payslipForm.getRawValue();
      console.log('Form values:', formValues); // Debug log
      
      // Make sure all required values are present
      if (!formValues.empId) {
        throw new Error('Employee ID is required');
      }

      // Always use employee ID 22
      const employeeId = 22;

      // Validate and convert all numeric fields
      console.log('Raw base salary:', formValues.BaseSalary);
      const BaseSalary = Number(formValues.BaseSalary);
      const allowances = Number(formValues.allowances);
      const deductions = Number(formValues.deductions);
      
      console.log('Converted base salary:', BaseSalary);
      
      if (isNaN(BaseSalary) || isNaN(allowances) || isNaN(deductions)) {
        throw new Error('Invalid numeric values in form');
      }

      // Additional validation for salary values
      if (BaseSalary <= 0) {
        throw new Error('Base salary must be greater than 0');
      }

      console.log('Base salary after validation:', BaseSalary);

      if (allowances < 0) {
        throw new Error('Allowances cannot be negative');
      }

      if (deductions < 0) {
        throw new Error('Deductions cannot be negative');
      }

      // Get salary from form
      const Salary = Number(formValues.salary);
      if (isNaN(Salary) || Salary <= 0) {
        throw new Error('Salary must be greater than 0');
      }

      // HR's ID is 22 (the logged-in HR user)
      const hrEmployeeId = 22; // This should come from your auth service in a real app

      // Create payslip data with createdBy field
      const payslipData: Payslip = {
        employeeId: employeeId,
        month: month,
        year: parseInt(year),
        Salary: Salary,
        BaseSalary: BaseSalary,
        allowances: allowances,
        deductions: deductions,
        netSalary: Salary - deductions,
        createdBy: hrEmployeeId // Add the HR's ID who is creating this payslip
      };

      console.log('Payslip data to be sent:', payslipData); // Debug log

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      const fileName = `Payslip-${payslipData.employeeId}-${this.#payPeriod.replace(/\s+/g, '-')}.pdf`;
      
      // Determine whether to create or update
      const saveOperation = this.isEditMode && this.payslipId
        ? this.payslipService.updatePayslip(this.payslipId, payslipData)
        : this.payslipService.createPayslip(payslipData);

      // Save or update payslip data
      saveOperation.subscribe({
        next: (response: any) => {
          // Handle both cases: response with id property or response itself being the id
          const payslipId = response.id || response;
          if (!payslipId) {
            console.error('Invalid response:', response);
            throw new Error('Could not determine payslip ID from server response');
          }

          // Create a File object from the PDF blob
          const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
          
          // Upload the PDF file
          this.payslipService.uploadPayslipPdf(payslipId, pdfFile).subscribe({
            next: () => {
              // Save the PDF locally as well
              pdf.save(fileName);
              const message = this.isEditMode 
                ? 'Payslip updated and PDF uploaded successfully!'
                : 'Payslip saved and PDF uploaded successfully!';
              alert(message);
              this.router.navigate(['/payslips']); // Navigate back to payslip list
            },
            error: (error: any) => {
              console.error('Error uploading PDF:', error);
              let errorMessage = 'Payslip saved but PDF upload failed. ';
              if (error.status === 413) {
                errorMessage += 'The PDF file is too large.';
              } else if (error.status === 415) {
                errorMessage += 'Invalid file format.';
              } else {
                errorMessage += 'Please try uploading the PDF later.';
              }
              alert(errorMessage);
              pdf.save(fileName); // Still save the PDF locally
            }
          });
        },
        error: (error: any) => {
          console.error('Error saving payslip:', error);
          let errorMessage = 'Error saving payslip: ';
          if (error.status === 400) {
            errorMessage += 'Invalid payslip data. Please check all fields.';
          } else if (error.status === 401) {
            errorMessage += 'Please log in again.';
          } else if (error.error?.message) {
            errorMessage += error.error.message;
          } else {
            errorMessage += 'An unexpected error occurred. Please try again.';
          }
          alert(errorMessage);
          pdf.save(fileName); // Still save the PDF locally
        }
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error instanceof Error ? error.message : error);
      alert('Error generating PDF. Please try again.');
    }
  }
}
