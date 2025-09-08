import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './leave-form.html'
})
export class LeaveForm {
  leaveForm: FormGroup;
  minDate: string;
  successMessage: string = '';
  errorMessage: string = '';
  leaveTypes = [
    
    { id: 'sick', name: 'Sick Leave' },
    { id: 'personal', name: 'Personal Leave' },
    { id: 'maternity', name: 'Maternity Leave' },
    { id: 'paternity', name: 'Paternity Leave' },
    { id: 'bereavement', name: 'Bereavement Leave' },
    { id: 'unpaid', name: 'Unpaid Leave' }
  ];

  numberOfDays: number = 0;

  constructor(private fb: FormBuilder, private router: Router) {
    // Get current date in YYYY-MM-DD format for min date validation
    this.minDate = new Date().toISOString().split('T')[0];
    
    this.leaveForm = this.fb.group({
      leaveType: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    }, { validators: this.dateRangeValidator });

    // Subscribe to date changes to calculate number of days
    this.leaveForm.valueChanges.subscribe(() => {
      this.calculateNumberOfDays();
    });
  }

  calculateNumberOfDays() {
    const startDate = this.leaveForm.get('startDate')?.value;
    const endDate = this.leaveForm.get('endDate')?.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Calculate the time difference in milliseconds
      const timeDiff = end.getTime() - start.getTime();
      
      // Convert to days and add 1 to include both start and end dates
      this.numberOfDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
      
      // Reset to 0 if calculation is negative (invalid date range)
      if (this.numberOfDays < 0) {
        this.numberOfDays = 0;
      }
    } else {
      this.numberOfDays = 0;
    }
  }

  // Custom validator to ensure end date is not before start date
  dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    
    if (start && end) {
      return new Date(start) <= new Date(end) 
        ? null 
        : { dateRange: true };
    }
    return null;
  }

  onSubmit() {
    if (this.leaveForm.valid) {
      // Replace this with your actual API call
      this.successMessage = 'Leave request submitted successfully!';
      setTimeout(() => {
        this.successMessage = '';
        this.router.navigate(['/dashboard']);
      }, 1500);
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard']);
  }
}
