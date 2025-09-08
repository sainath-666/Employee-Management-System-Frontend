import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LeaveService, LeaveRequest } from '../../services/leave.service';
import { AuthService } from '../../services/auth.service';
import { LeaveTypeEnum } from '../../models/leaveTypeEnum';
import { StatusEnum } from '../../models/statusEnum';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './leave-management.html',
  styleUrls: ['./leave-management.css'],
})
export class LeaveManagement implements OnInit {
  StatusEnum = StatusEnum; // Make StatusEnum available in template

  displayedColumns: string[] = [
    'employeeName',
    'department',
    'type',
    'duration',
    'reason',
    'status',
    'actions',
  ];

  leaveRequests: LeaveRequest[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private leaveService: LeaveService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadLeaveRequests();
  }

  loadLeaveRequests(): void {
    this.isLoading = true;
    this.error = null;
    this.leaveService.getAllLeaveRequests().subscribe({
      next: (requests) => {
        // Log the raw response
        console.log('Raw API response:', requests);

        this.leaveRequests = requests.map((request) => {
          const rawType = request.leaveTypeID;
          console.log('Raw leave type:', rawType);

          return {
            ...request,
            leaveTypeID: rawType
          };
        });

        console.log('Processed requests:', this.leaveRequests);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load leave requests. Please try again later.';
        this.isLoading = false;
        this.showNotification(this.error, 'error');
      },
    });
  }

  approveLeave(id: number): void {
    const currentUserId = this.authService.getCurrentEmployeeId();
    if (!currentUserId) {
      this.showNotification('Missing current user id. Please re-login.', 'error');
      return;
    }
    const request = this.leaveRequests.find((r) => r.id === id);
    if (!request) {
      this.showNotification('Leave request not found', 'error');
      return;
    }
    // Optimistic UI update
    const previousStatus = request.status;
    request.status = StatusEnum.Accepted;

    this.leaveService.updateLeaveStatus(request, 'Approved', currentUserId).subscribe({
      next: (res) => {
        console.log('Approve response:', res);
        this.showNotification('Leave request approved successfully', 'success');
      },
      error: (error) => {
        console.error('Approve error:', error);
        request.status = previousStatus; // revert
        const message = (error && (error.error || error.message)) || 'Failed to approve leave request. Please try again.';
        this.showNotification(message, 'error');
      },
    });
  }

  rejectLeave(id: number): void {
    const currentUserId = this.authService.getCurrentEmployeeId();
    if (!currentUserId) {
      this.showNotification('Missing current user id. Please re-login.', 'error');
      return;
    }
    const request = this.leaveRequests.find((r) => r.id === id);
    if (!request) {
      this.showNotification('Leave request not found', 'error');
      return;
    }
    // Optimistic UI update
    const previousStatus = request.status;
    request.status = StatusEnum.Rejected;

    this.leaveService.updateLeaveStatus(request, 'Rejected', currentUserId).subscribe({
      next: (res) => {
        console.log('Reject response:', res);
        this.showNotification('Leave request rejected successfully', 'success');
      },
      error: (error) => {
        console.error('Reject error:', error);
        request.status = previousStatus; // revert
        const message = (error && (error.error || error.message)) || 'Failed to reject leave request. Please try again.';
        this.showNotification(message, 'error');
      },
    });
  }

  getChipColor(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  getDuration(start: string | Date | undefined, end: string | Date | undefined): string {
    if (!start || !end) return 'N/A';
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  formatDate(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getLeaveTypeLabel(type: LeaveTypeEnum | undefined): string {
    if (type === undefined || type === null) {
      return 'Unknown';
    }

    switch (type) {
      case LeaveTypeEnum.Sick:
        return 'Sick Leave';
      case LeaveTypeEnum.Casual:
        return 'Casual Leave';
      case LeaveTypeEnum.Earned:
        return 'Earned Leave';
      case LeaveTypeEnum.Maternity:
        return 'Maternity Leave';
      case LeaveTypeEnum.Paternity:
        return 'Paternity Leave';
      case LeaveTypeEnum.Other:
        return 'Other';
      default:
        return 'Unknown';
    }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar'],
    });
  }

  getStatusLabel(status: StatusEnum): string {
    switch (status) {
      case StatusEnum.Pending:
        return 'Pending';
      case StatusEnum.Accepted:
        return 'Accepted';
      case StatusEnum.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
}
