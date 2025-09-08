import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LeaveService } from '../../services/leave.service';
import { AuthService } from '../../services/auth.service';
import { DepartmentEmployeeService } from '../../services/department-employee.service';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service';
import { StatusEnum } from '../../models/statusEnum';
import { LeaveTypeEnum } from '../../models/leaveTypeEnum';

import { LeaveRequest as ServiceLeaveRequest } from '../../services/leave.service';

interface LeaveRequest extends Omit<ServiceLeaveRequest, 'statusColor'> {
  statusColor?: string;
}

interface Department {
  id: number;
  departmentName: string;
  status: boolean;
  createdBy: number | null;
  createdDateTime: string;
  updatedBy: number | null;
  updatedDateTime: string | null;
}

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
  protected readonly StatusEnum = StatusEnum;
  protected leaveRequests = new Array<LeaveRequest>();
  protected isLoading = false;
  protected error: string | null = null;
  protected isHr = false;
  protected displayedColumns = new Array<string>();
  protected employeeNames = new Map<number, string>();
  protected employeeDepartments = new Map<number, string>();

  constructor(
    private readonly leaveService: LeaveService,
    private readonly snackBar: MatSnackBar,
    private readonly authService: AuthService,
    private readonly departmentEmployeeService: DepartmentEmployeeService,
    private readonly employeeService: EmployeeService,
    private readonly departmentService: DepartmentService
  ) {}

  public ngOnInit(): void {
    this.setDisplayColumns();
    this.loadLeaveRequests();
  }

  private setDisplayColumns(): void {
    const roleId = this.authService.getCurrentUserRole();
    console.log('Role ID from auth service:', roleId, typeof roleId);
    this.isHr = roleId === 9; // 9 is HR role
    console.log('Current Role ID:', roleId, 'Is HR:', this.isHr);

    if (!this.isHr) {
      console.warn('User is not HR. Departments will not be loaded.');
    }

    this.displayedColumns = [
      'employeeName',
      ...(this.isHr ? ['department'] : []),
      'leaveType',
      'startDate',
      'endDate',
      'reason',
      'status',
      'actions',
    ];
  }

  private loadEmployeeDepartment(employeeId: number): void {
    console.log('Loading departments for employee:', employeeId);
    this.departmentEmployeeService
      .getDepartmentsForEmployee(employeeId)
      .subscribe({
        next: (departments: Department[]) => {
          console.log(
            'Received departments for employee',
            employeeId,
            ':',
            departments
          );
          if (departments && departments.length > 0) {
            // Create a list of department names, filtered to remove any null or undefined values
            const departmentNames = departments
              .filter((dept) => dept && dept.departmentName)
              .map((dept) => dept.departmentName)
              .join(', ');

            console.log(
              'Department names for employee',
              employeeId,
              ':',
              departmentNames
            );
            this.employeeDepartments.set(employeeId, departmentNames);
          } else {
            console.log('No departments found for employee', employeeId);
            this.employeeDepartments.set(employeeId, 'No Department');
          }
        },
        error: (error) => {
          console.error(
            'Error loading departments for employee',
            employeeId,
            ':',
            error
          );
          this.employeeDepartments.set(employeeId, 'Error loading departments');
          this.showNotification('Error loading employee departments', 'error');
        },
      });
  }

  protected loadLeaveRequests(): void {
    this.isLoading = true;
    this.error = null;

    console.log('Loading leave requests...');

    this.leaveService.getAllLeaveRequests().subscribe({
      next: (requests) => {
        console.log('Received leave requests:', requests);

        const currentEmployeeId = this.authService.getCurrentEmployeeId();

        // Filter requests based on user role
        this.leaveRequests = requests
          .filter(
            (request) => this.isHr || request.employeeId === currentEmployeeId
          )
          .map((request) => ({
            ...request,
            statusColor: this.getStatusColor(request.status),
          }));

        // Get unique employee IDs
        const uniqueEmployeeIds = [
          ...new Set(this.leaveRequests.map((r) => r.employeeId)),
        ];

        // Load data for each unique employee
        uniqueEmployeeIds.forEach((employeeId) => {
          if (!employeeId) return;

          // Load employee name
          this.employeeService.getEmployeeById(employeeId).subscribe({
            next: (employee) => {
              console.log('Received employee:', employee);
              this.employeeNames.set(employeeId, employee.name);
            },
            error: (error) => {
              console.error('Error loading employee:', error);
              this.employeeNames.set(employeeId, `Employee ${employeeId}`);
            },
          });

          // Load department if user is HR
          if (this.isHr) {
            this.loadEmployeeDepartment(employeeId);
          }
        });

        console.log('Processed requests:', this.leaveRequests);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load leave requests. Please try again later.';
        this.isLoading = false;
        console.error('Error loading leave requests:', error);
        this.showNotification(this.error, 'error');
      },
    });
  }

  protected canApproveReject(request: LeaveRequest): boolean {
    const currentUserId = this.authService.getCurrentEmployeeId();
    return this.isHr && request.employeeId !== currentUserId;
  }

  private getStatusColor(status: StatusEnum): string {
    switch (status) {
      case StatusEnum.Accepted:
        return '#4CAF50'; // Green
      case StatusEnum.Rejected:
        return '#F44336'; // Red
      case StatusEnum.Pending:
        return '#FFC107'; // Yellow
      default:
        return '#9E9E9E'; // Grey
    }
  }

  protected handleLeaveAction(id: number, action: 'accept' | 'reject'): void {
    const request = this.leaveRequests.find((r) => r.id === id);
    if (!request) {
      this.showNotification('Leave request not found', 'error');
      return;
    }

    const currentUserId = this.authService.getCurrentEmployeeId();
    if (!this.isHr || request.employeeId === currentUserId) {
      this.showNotification(
        'You do not have permission to perform this action',
        'error'
      );
      return;
    }

    if (!currentUserId) {
      this.showNotification(
        'Could not identify current user. Please try again.',
        'error'
      );
      return;
    }

    this.leaveService
      .updateLeaveStatus(
        request,
        action === 'accept' ? 'Approved' : 'Rejected',
        currentUserId
      )
      .subscribe({
        next: (res) => {
          this.showNotification(
            `Leave request ${action}ed successfully`,
            'success'
          );
          this.loadLeaveRequests();
        },
        error: (error) => {
          console.error('Error updating leave status:', error);
          this.showNotification(`Failed to ${action} leave request`, 'error');
        },
      });
  }

  protected deleteLeaveRequest(id: number): void {
    const request = this.leaveRequests.find((r) => r.id === id);
    if (!request) {
      this.showNotification('Leave request not found', 'error');
      return;
    }

    const currentUserId = this.authService.getCurrentEmployeeId();
    if (request.employeeId !== currentUserId) {
      this.showNotification(
        'You can only delete your own leave requests',
        'error'
      );
      return;
    }

    this.leaveService.deleteLeaveRequest(id).subscribe({
      next: (res) => {
        this.showNotification('Leave request deleted successfully', 'success');
        this.loadLeaveRequests();
      },
      error: (error) => {
        console.error('Error deleting leave request:', error);
        this.showNotification('Failed to delete leave request', 'error');
      },
    });
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'error' ? 'error-snackbar' : 'success-snackbar',
    });
  }

  protected getLeaveTypeLabel(leaveTypeId?: LeaveTypeEnum): string {
    if (!leaveTypeId) return 'Unknown';
    return LeaveTypeEnum[leaveTypeId] || 'Unknown';
  }

  protected getDuration(startDate?: string, endDate?: string): string {
    if (!startDate || !endDate) return 'N/A';

    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }

  protected getStatusLabel(status: StatusEnum): string {
    return StatusEnum[status] || 'Unknown';
  }

  protected approveLeave(id: number): void {
    this.handleLeaveAction(id, 'accept');
  }

  protected rejectLeave(id: number): void {
    this.handleLeaveAction(id, 'reject');
  }

  protected formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
