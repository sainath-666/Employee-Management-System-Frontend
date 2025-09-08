import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LeaveService } from '../../services/leave.service';
import { LeaveTypeEnum } from '../../models/leaveTypeEnum';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './leave-form.html',
})
export class LeaveForm {
  leaveForm: FormGroup;
  minDate: string;
  successMessage: string = '';
  errorMessage: string = '';
  leaveTypes = [
    { id: LeaveTypeEnum.Sick, name: 'Sick Leave' },
    { id: LeaveTypeEnum.Casual, name: 'Casual Leave' },
    { id: LeaveTypeEnum.Earned, name: 'Earned Leave' },
    { id: LeaveTypeEnum.Maternity, name: 'Maternity Leave' },
    { id: LeaveTypeEnum.Paternity, name: 'Paternity Leave' },
    { id: LeaveTypeEnum.Other, name: 'Other Leave' },
  ];

  numberOfDays: number = 0;

  constructor(
    private fb: FormBuilder,
    private leaveService: LeaveService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Get current date in YYYY-MM-DD format for min date validation
    this.minDate = new Date().toISOString().split('T')[0];

    this.leaveForm = this.fb.group(
      {
        leaveType: ['', Validators.required],
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
        reason: ['', [Validators.required, Validators.minLength(10)]],
      },
      { validators: this.dateRangeValidator }
    );

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
      return new Date(start) <= new Date(end) ? null : { dateRange: true };
    }
    return null;
  }

  onCancel() {
    this.router.navigate(['/dashboard']);
  }

  onSubmit() {
    if (!this.leaveForm.valid) {
      this.showNotification(
        'Please fill all required fields correctly',
        'error'
      );
      return;
    }

    const employeeId = this.authService.getCurrentEmployeeId();
    if (!employeeId) {
      this.showNotification(
        'User not authenticated. Please login again.',
        'error'
      );
      return;
    }

    if (this.leaveForm.valid) {
      const formValue = this.leaveForm.value;
      const leaveRequest = {
        employeeId: employeeId,
        leaveTypeID: parseInt(formValue.leaveType),
        startDate: new Date(formValue.startDate).toISOString(),
        endDate: new Date(formValue.endDate).toISOString(),
        maxDaysPerYear: this.numberOfDays,
        reason: formValue.reason,
        createdBy: employeeId,
        createdDateTime: new Date().toISOString(),
      };

      console.log('Submitting leave request:', leaveRequest);
      this.leaveService.createLeaveRequest(leaveRequest).subscribe({
        next: (response) => {
          this.showNotification(
            'Leave request submitted successfully',
            'success'
          );
          this.router.navigate(['/leave-management']);
        },
        error: (error) => {
          console.error('Error submitting leave request:', error);
          this.showNotification(
            error?.error?.message ||
              'Failed to submit leave request. Please try again.',
            'error'
          );
        },
      });
    } else {
      this.showNotification(
        'Please fill all required fields correctly',
        'error'
      );
    }
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar'],
    });
  }
}
