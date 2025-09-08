import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service';
import { LeaveService } from '../../services/leave.service';
import { DepartmentEmployeeService } from '../../services/department-employee.service';
import { StatusEnum } from '../../models/statusEnum';
import { Employee } from '../../interfaces/employee';

enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE',
}

interface DashboardStats {
  totalEmployees?: number;
  activeEmployees?: number;
  inactiveEmployees?: number;
  totalDepartments?: number;
  pendingLeaves?: number;
  employeesOnLeave?: number;
  leaveBalance?: number;
  departmentEmployeeCount?: number;
  payslipStatus?: string;
}

interface QuickAction {
  label: string;
  action: () => void;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  currentUser = {
    id: 1,
    name: '',
    role: UserRole.ADMIN,
    departmentId: 1,
    email: '',
  };

  statistics: DashboardStats = {
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalDepartments: 0,
    employeesOnLeave: 0,
    pendingLeaves: 0,
    leaveBalance: 0,
    departmentEmployeeCount: 0,
    payslipStatus: 'N/A',
  };

  departments: Array<{ name: string; count: number }> = [];
  recentActivities: Array<{ action: string; details: string; time: string }> =
    [];
  private departmentChart: Chart | null = null;

  quickActions: Record<UserRole, QuickAction[]> = {
    [UserRole.ADMIN]: [
      {
        label: 'Add Employee',
        action: () => this.addEmployee(),
        color: 'bg-blue-500 hover:bg-blue-600',
      },
      {
        label: 'Add Department',
        action: () => this.addDepartment(),
        color: 'bg-violet-500 hover:bg-violet-600',
      },
    ],
    [UserRole.HR]: [
      {
        label: 'Manage Leave',
        action: () => this.manageLeave(),
        color: 'bg-violet-500 hover:bg-violet-600',
      },
      {
        label: 'Generate Payslip',
        action: () => this.generatePayslip(),
        color: 'bg-green-500 hover:bg-green-600',
      },
    ],
    [UserRole.EMPLOYEE]: [
      {
        label: 'Apply for Leave',
        action: () => this.applyLeave(),
        color: 'bg-blue-500 hover:bg-blue-600',
      },
      {
        label: 'View My Payslip',
        action: () => this.viewMyPayslip(),
        color: 'bg-violet-500 hover:bg-violet-600',
      },
      {
        label: 'Update Profile',
        action: () => this.updateProfile(),
        color: 'bg-green-500 hover:bg-green-600',
      },
    ],
  };

  statsConfig: Record<
    UserRole,
    Array<{ label: string; value: () => number | string; color: string }>
  > = {
    [UserRole.ADMIN]: [
      {
        label: 'Total Employees',
        value: () => this.statistics.totalEmployees!,
        color: 'text-blue-600',
      },
      {
        label: 'Active Employees',
        value: () => this.statistics.activeEmployees!,
        color: 'text-green-600',
      },
      {
        label: 'Inactive Employees',
        value: () => this.statistics.inactiveEmployees!,
        color: 'text-red-600',
      },
      {
        label: 'Total Departments',
        value: () => this.statistics.totalDepartments!,
        color: 'text-violet-600',
      },
    ],
    [UserRole.HR]: [
      {
        label: 'Active Employees',
        value: () => this.statistics.activeEmployees!,
        color: 'text-blue-600',
      },
      {
        label: 'Pending Leaves',
        value: () => this.statistics.pendingLeaves!,
        color: 'text-yellow-600',
      },
      {
        label: 'Departments',
        value: () => this.statistics.totalDepartments!,
        color: 'text-violet-600',
      },
      {
        label: 'On Leave Employees',
        value: () => this.statistics.employeesOnLeave!,
        color: 'text-green-600',
      },
    ],
    [UserRole.EMPLOYEE]: [
      {
        label: 'Leave Balance',
        value: () => this.statistics.leaveBalance!,
        color: 'text-blue-600',
      },
      {
        label: 'Department Size',
        value: () => this.statistics.departmentEmployeeCount!,
        color: 'text-violet-600',
      },
      {
        label: 'Payslip Status',
        value: () => this.statistics.payslipStatus!,
        color: 'text-green-600',
      },
    ],
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private leaveService: LeaveService,
    private departmentEmployeeService: DepartmentEmployeeService
  ) {
    Chart.register(...registerables);
    const roleId = this.authService.getUserRole();
    if (roleId === 10) {
      this.currentUser.role = UserRole.ADMIN;
    } else if (roleId === 9) {
      this.currentUser.role = UserRole.HR;
    } else if (roleId === 2) {
      this.currentUser.role = UserRole.EMPLOYEE;
    }
  }

  ngOnInit() {
    this.loadEmployeeStats();
    this.loadLeaveStats();
    this.updateRecentActivities();
  }

  private loadEmployeeStats() {
    this.employeeService.getAllEmployees().subscribe({
      next: (employees: any[]) => {
        this.statistics.totalEmployees = employees.length;
        this.statistics.activeEmployees = employees.filter(
          (e) => e.status === true
        ).length;
        this.statistics.inactiveEmployees = employees.filter(
          (e) => e.status === false
        ).length;

        // After getting employees, fetch departments
        this.loadDepartmentsData(employees);
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
        // Initialize with zeros in case of error
        this.statistics.totalEmployees = 0;
        this.statistics.activeEmployees = 0;
        this.statistics.inactiveEmployees = 0;
      },
    });
  }

  private loadLeaveStats() {
    this.leaveService.getAllLeaveRequests().subscribe({
      next: (leaves) => {
        const today = new Date();

        // Count employees currently on leave
        this.statistics.employeesOnLeave = leaves.filter((l) => {
          if (!l.startDate || !l.endDate) return false;
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          return (
            l.status === StatusEnum.Accepted && start <= today && end >= today
          );
        }).length;

        // Count pending leaves
        this.statistics.pendingLeaves = leaves.filter(
          (l) => l.status === StatusEnum.Pending
        ).length;
      },
      error: (error) => {
        console.error('Error fetching leave requests:', error);
        this.statistics.employeesOnLeave = 0;
        this.statistics.pendingLeaves = 0;
      },
    });
  }

  private loadDepartmentsData(employees: any[]) {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.statistics.totalDepartments = departments.length;
        this.departments = [];

        // Create a map to store department data while we fetch counts
        const departmentMap = new Map(
          departments.map((dept) => [
            dept.id,
            { name: dept.departmentName || 'Unknown', count: 0 },
          ])
        );

        let processedEmployees = 0;
        const totalEmployees = employees.length;

        // For each employee, get their department assignments
        employees.forEach((employee) => {
          if (employee.id) {
            this.departmentEmployeeService
              .getDepartmentsForEmployee(employee.id)
              .subscribe({
                next: (employeeDepartments) => {
                  // Update counts for each department this employee belongs to
                  employeeDepartments.forEach((dept) => {
                    const departmentData = departmentMap.get(dept.id);
                    if (departmentData) {
                      departmentData.count++;
                    }
                  });

                  processedEmployees++;
                  // Check if all employees have been processed
                  if (processedEmployees === totalEmployees) {
                    // Convert map to array for the chart
                    this.departments = Array.from(departmentMap.values());
                    // Initialize chart after getting all department data
                    setTimeout(() => this.initializeDepartmentChart(), 0);
                  }
                },
                error: (error) => {
                  console.error(
                    `Error fetching departments for employee ${employee.id}:`,
                    error
                  );
                  processedEmployees++;
                  // Even if there's an error, check if all employees have been processed
                  if (processedEmployees === totalEmployees) {
                    this.departments = Array.from(departmentMap.values());
                    setTimeout(() => this.initializeDepartmentChart(), 0);
                  }
                },
              });
          }
        });
      },
      error: (error) => {
        console.error('Error fetching departments:', error);
        this.statistics.totalDepartments = 0;
        this.departments = [];
      },
    });
  }

  private initializeDepartmentChart() {
    const canvas = document.getElementById(
      'departmentChart'
    ) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.departmentChart) {
      this.departmentChart.destroy();
    }

    // Create new chart
    this.departmentChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.departments.map((dept) => `${dept.name} (${dept.count})`),
        datasets: [
          {
            data: this.departments.map((dept) => dept.count),
            backgroundColor: this.departments.map((_, index) => {
              const colors = [
                '#3B82F6', // Blue
                '#10B981', // Green
                '#F59E0B', // Yellow
                '#8B5CF6', // Purple
                '#EC4899', // Pink
                '#6366F1', // Indigo
              ];
              return colors[index % colors.length];
            }),
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverBorderWidth: 0,
            hoverOffset: 15,
            spacing: 2,
            borderRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 13,
                family: "'Inter', sans-serif",
                weight: 500,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            bodySpacing: 4,
            bodyFont: {
              size: 13,
              family: "'Inter', sans-serif",
            },
          },
        },
      },
    });
  }

  private formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  private updateRecentActivities() {
    if (this.currentUser.role === UserRole.EMPLOYEE) {
      this.leaveService
        .getLeaveRequestsByEmployee(this.currentUser.id)
        .subscribe({
          next: (leaves) => {
            this.recentActivities = leaves.slice(0, 4).map((leave) => ({
              action: 'Leave Request',
              details: `Leave request from ${this.formatDate(
                leave.startDate
              )} to ${this.formatDate(leave.endDate)} - ${leave.status}`,
              time: this.getTimeAgo(new Date(leave.startDate || new Date())),
            }));
          },
          error: (error) => {
            console.error('Error fetching employee leave requests:', error);
            this.recentActivities = [];
          },
        });
    } else {
      this.leaveService.getAllLeaveRequests().subscribe({
        next: (leaves) => {
          this.recentActivities = leaves.slice(0, 4).map((leave) => ({
            action: 'Leave Request',
            details: `Leave Request - ${leave.status}`,
            time: this.getTimeAgo(new Date(leave.startDate || new Date())),
          }));
        },
        error: (error) => {
          console.error('Error fetching all leave requests:', error);
          this.recentActivities = [];
        },
      });
    }
  }

  // Navigation methods
  private addEmployee(): void {
    this.router.navigate(['/employee-form']);
  }

  private addDepartment(): void {
    this.router.navigate(['/department-form']);
  }

  public manageLeave(): void {
    this.router.navigate(['/leave-management']);
  }

  private generatePayslip(): void {
    this.router.navigate(['/payslip-form']);
  }

  private applyLeave(): void {
    this.router.navigate(['/leave-form']);
  }

  private viewMyPayslip(): void {
    this.router.navigate(['/payslip-list']);
  }

  private updateProfile(): void {
    const employeeId = this.authService.getCurrentEmployeeId();
    if (employeeId) {
      this.router.navigate(['/employee-form', employeeId]);
    }
  }
}
