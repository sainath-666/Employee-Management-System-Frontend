import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service';
import { LeaveService } from '../../services/leave.service';
import { DepartmentEmployeeService } from '../../services/department-employee.service';
import { PayslipService } from '../../services/payslip.service';
import { StatusEnum } from '../../models/statusEnum';
import { LeaveTypeEnum } from '../../models/leaveTypeEnum';
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
  departmentName?: string;
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
        label: 'Department',
        value: () => this.statistics.departmentName || 'Not Available',
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
    private departmentEmployeeService: DepartmentEmployeeService,
    private payslipService: PayslipService
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
    const employeeId = this.authService.getCurrentEmployeeId();
    if (employeeId) {
      this.currentUser.id = employeeId;
    }

    // Set default leave balance
    this.statistics.leaveBalance = 15;

    if (this.currentUser.role === UserRole.EMPLOYEE) {
      this.loadEmployeeDepartmentData();
      this.loadPayslipStatus(this.currentUser.id);
    } else {
      this.loadEmployeeStats();
      this.loadLeaveStats();
    }
    this.updateRecentActivities();
  }

  private loadEmployeeDepartmentData() {
    this.departmentEmployeeService
      .getDepartmentsForEmployee(this.currentUser.id)
      .subscribe({
        next: (departments) => {
          if (departments && departments.length > 0) {
            const department = departments[0];
            this.statistics.departmentName = department.departmentName;

            // Get all employees to count department size
            this.employeeService.getAllEmployees().subscribe({
              next: (employees: any[]) => {
                let departmentSize = 0;
                let processedCount = 0;

                employees.forEach((employee) => {
                  this.departmentEmployeeService
                    .getDepartmentsForEmployee(employee.id)
                    .subscribe({
                      next: (empDepartments) => {
                        if (
                          empDepartments.some(
                            (dept) => dept.id === department.id
                          )
                        ) {
                          departmentSize++;
                        }
                        processedCount++;

                        if (processedCount === employees.length) {
                          this.statistics.departmentEmployeeCount =
                            departmentSize;
                          this.departments = [
                            {
                              name: 'Department Size',
                              count: departmentSize,
                            },
                            {
                              name: 'Leave Balance',
                              count: 15, // Fixed value for all employees
                            },
                          ];
                          setTimeout(() => this.initializeDepartmentChart(), 0);
                        }
                      },
                      error: () => {
                        processedCount++;
                        if (processedCount === employees.length) {
                          this.updateChartWithDefaultValues();
                        }
                      },
                    });
                });
              },
              error: (err: Error) => {
                console.error('Error fetching employees:', err);
                this.updateChartWithDefaultValues();
              },
            });
          } else {
            this.updateChartWithDefaultValues();
          }
        },
        error: (err: Error) => {
          console.error('Error fetching employee department:', err);
          this.statistics.departmentName = 'Not Available';
          this.updateChartWithDefaultValues();
        },
      });
  }

  private updateChartWithDefaultValues() {
    this.statistics.departmentEmployeeCount = 1;
    this.departments = [
      {
        name: 'Department Size',
        count: 1,
      },
      {
        name: 'Leave Balance',
        count: this.statistics.leaveBalance || 15,
      },
    ];
    setTimeout(() => this.initializeDepartmentChart(), 0);
  }

  private loadPayslipStatus(employeeId: number) {
    this.payslipService.getPayslipsByEmployeeId(employeeId).subscribe({
      next: (payslips) => {
        if (payslips && payslips.length > 0) {
          const lastPayslip = payslips[payslips.length - 1];
          // If there's a PDF generated, show as Generated
          if (lastPayslip.pdfPath) {
            this.statistics.payslipStatus = 'Generated';
          } else {
            this.statistics.payslipStatus = 'Processing';
          }
        } else {
          this.statistics.payslipStatus = 'Pending';
        }
      },
      error: (error) => {
        console.error('Error fetching payslip status:', error);
        this.statistics.payslipStatus = 'Not Available';
      },
    });
  }

  // Removed loadEmployeeLeaveBalance as we're using fixed value of 15 for all employees

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

        // After getting employees, fetch departments for Admin/HR view
        this.loadDepartmentsData(employees);
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
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
        this.statistics.employeesOnLeave = leaves.filter((l) => {
          if (!l.startDate || !l.endDate) return false;
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          return (
            l.status === StatusEnum.Accepted && start <= today && end >= today
          );
        }).length;

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

        const departmentMap = new Map(
          departments.map((dept) => [
            dept.id,
            { name: dept.departmentName || 'Unknown', count: 0 },
          ])
        );

        let processedEmployees = 0;
        const totalEmployees = employees.length;

        employees.forEach((employee) => {
          if (employee.id) {
            this.departmentEmployeeService
              .getDepartmentsForEmployee(employee.id)
              .subscribe({
                next: (employeeDepartments) => {
                  employeeDepartments.forEach((dept) => {
                    const departmentData = departmentMap.get(dept.id);
                    if (departmentData) {
                      departmentData.count++;
                    }
                  });

                  processedEmployees++;
                  if (processedEmployees === totalEmployees) {
                    this.departments = Array.from(departmentMap.values());
                    setTimeout(() => this.initializeDepartmentChart(), 0);
                  }
                },
                error: (error) => {
                  console.error(
                    `Error fetching departments for employee ${employee.id}:`,
                    error
                  );
                  processedEmployees++;
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

    if (this.departmentChart) {
      this.departmentChart.destroy();
    }

    if (this.currentUser.role === UserRole.EMPLOYEE) {
      // Employee view - bar chart showing their department size and leave balance
      this.departmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.departments.map((dept) => dept.name),
          datasets: [
            {
              data: this.departments.map((dept) => dept.count),
              backgroundColor: [
                '#3B82F6', // Blue for Department Size
                '#10B981', // Green for Leave Balance
              ],
              borderColor: '#ffffff',
              borderWidth: 1,
              borderRadius: 8,
              maxBarThickness: 50,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              bodyFont: {
                size: 13,
                family: "'Inter', sans-serif",
              },
              callbacks: {
                label: (context) => {
                  return `${context.raw}`;
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
              ticks: {
                font: {
                  size: 12,
                },
              },
            },
            y: {
              grid: {
                display: false,
              },
              ticks: {
                font: {
                  size: 14,
                  weight: 500,
                },
              },
            },
          },
        },
      });
    } else {
      // Admin/HR view - pie chart showing department distribution
      this.departmentChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: this.departments.map(
            (dept) => `${dept.name} (${dept.count})`
          ),
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
    } else if (this.currentUser.role === UserRole.HR) {
      // For HR, show leave requests
      this.employeeService.getAllEmployees().subscribe({
        next: (employees) => {
          const employeeMap = new Map(
            employees.map((emp) => [emp.id, `${emp.firstName} ${emp.lastName}`])
          );

          // Get leave requests
          this.leaveService.getAllLeaveRequests().subscribe({
            next: (leaves) => {
              // Sort by most recent first
              this.recentActivities = leaves
                .sort(
                  (a, b) =>
                    new Date(b.createdDateTime).getTime() -
                    new Date(a.createdDateTime).getTime()
                )
                .slice(0, 5) // Take only the 5 most recent
                .map((leave) => {
                  const employeeName =
                    employeeMap.get(leave.employeeId) ||
                    `Employee ID: ${leave.employeeId}`;
                  const leaveTypeText =
                    LeaveTypeEnum[leave.leaveTypeID || 0] || 'Leave';
                  const statusText = StatusEnum[leave.status] || leave.status;

                  return {
                    action: `${leaveTypeText} Request`,
                    details: `${employeeName} | ${this.formatDate(
                      leave.startDate
                    )} to ${this.formatDate(
                      leave.endDate
                    )} | Status: ${statusText}`,
                    time: this.getTimeAgo(new Date(leave.createdDateTime)),
                  };
                });
            },
            error: (error) => {
              console.error('Error fetching leave requests:', error);
              this.recentActivities = [];
            },
          });
        },
        error: (error) => {
          console.error('Error fetching employees:', error);
          this.recentActivities = [];
        },
      });
    } else {
      // Admin view - show employee and department additions
      const activities: { action: string; details: string; time: Date }[] = [];

      // Get recently added employees
      this.employeeService.getAllEmployees().subscribe({
        next: (employees) => {
          const recentEmployees = employees
            .sort(
              (a, b) =>
                new Date(b.createdDateTime || 0).getTime() -
                new Date(a.createdDateTime || 0).getTime()
            )
            .slice(0, 3)
            .map((emp) => ({
              action: 'New Employee Added',
              details: `${emp.firstName} ${emp.lastName} | ${
                emp.email || 'No email'
              }`,
              time: new Date(emp.createdDateTime || new Date()),
            }));

          activities.push(...recentEmployees);
          updateActivitiesList();
        },
        error: (error) => {
          console.error('Error fetching employees:', error);
          updateActivitiesList();
        },
      });

      // Get recently added departments
      this.departmentService.getAllDepartments().subscribe({
        next: (departments) => {
          const recentDepartments = departments
            .sort(
              (a, b) =>
                new Date(b.createdDateTime || 0).getTime() -
                new Date(a.createdDateTime || 0).getTime()
            )
            .slice(0, 2)
            .map((dept) => ({
              action: 'New Department Added',
              details: dept.departmentName || 'Unnamed Department',
              time: new Date(dept.createdDateTime || new Date()),
            }));

          activities.push(...recentDepartments);
          updateActivitiesList();
        },
        error: (error) => {
          console.error('Error fetching departments:', error);
          updateActivitiesList();
        },
      });

      const updateActivitiesList = () => {
        this.recentActivities = activities
          .sort((a, b) => b.time.getTime() - a.time.getTime())
          .slice(0, 5)
          .map((activity) => ({
            action: activity.action,
            details: activity.details,
            time: this.getTimeAgo(activity.time),
          }));
      };
    }
  }

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
    this.router.navigate(['/emp-details']);
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
