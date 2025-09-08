import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

type DepartmentConfig = {
  capacity: number;
  color: string;
};

enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE',
}

interface UserProfile {
  id: number;
  name: string;
  role: UserRole;
  departmentId: number;
  email: string;
}

interface DashboardStats {
  totalEmployees?: number;
  activeEmployees?: number;
  inactiveEmployees?: number;
  totalDepartments?: number;
  pendingLeaves?: number;
  monthlyPayroll?: number;
  leaveBalance?: number;
  departmentEmployeeCount?: number;
  payslipStatus?: string;
}

interface QuickAction {
  label: string;
  action: () => void;
  icon?: string;
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
  currentUser: UserProfile = {
    id: 1,
    name: '',
    role: UserRole.EMPLOYEE,
    departmentId: 1,
    email: '',
  };

  // Register Chart.js components
  constructor(private authService: AuthService, private router: Router) {
    Chart.register(...registerables);

    // Set the user role based on the role ID from token
    const roleId = this.authService.getUserRole();
    if (roleId === 10) {
      this.currentUser.role = UserRole.ADMIN;
    } else if (roleId === 9) {
      this.currentUser.role = UserRole.HR;
    } else if (roleId === 2) {
      this.currentUser.role = UserRole.EMPLOYEE;
    }
  }

  // Role-based statistics configuration
  statistics: DashboardStats = {
    totalEmployees: 150,
    activeEmployees: 142,
    inactiveEmployees: 8,
    totalDepartments: 6,
    monthlyPayroll: 450000,
    pendingLeaves: 12,
    leaveBalance: 15,
    departmentEmployeeCount: 45,
    payslipStatus: 'Generated',
  };

  // Quick actions configuration based on role
  quickActions: Record<UserRole, QuickAction[]> = {
    [UserRole.ADMIN]: [
      {
        label: 'Add Employee',
        action: () => this.addEmployee(),
        color: 'bg-blue-500 hover:bg-blue-600',
      },
      {
        label: 'Manage Departments',
        action: () => this.manageDepartments(),
        color: 'bg-violet-500 hover:bg-violet-600',
      },
      {
        label: 'Generate Payslips',
        action: () => this.generatePayslips(),
        color: 'bg-green-500 hover:bg-green-600',
      },
      {
        label: 'Approve Leaves',
        action: () => this.approveLeaves(),
        color: 'bg-yellow-500 hover:bg-yellow-600',
      },
    ],
    [UserRole.HR]: [
      {
        label: 'Add Employee',
        action: () => this.addEmployee(),
        color: 'bg-blue-500 hover:bg-blue-600',
      },
      {
        label: 'Approve Leaves',
        action: () => this.approveLeaves(),
        color: 'bg-violet-500 hover:bg-violet-600',
      },
      {
        label: 'Generate Payslips',
        action: () => this.generatePayslips(),
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

  // Role-based statistics cards configuration
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
        label: 'Monthly Payroll',
        value: () => this.statistics.monthlyPayroll!,
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

  // Department configuration with capacity and color information
  readonly departmentConfig: Record<string, DepartmentConfig> = {
    Engineering: { capacity: 60, color: '#3B82F6' }, // Blue
    Sales: { capacity: 40, color: '#10B981' }, // Green
    Marketing: { capacity: 30, color: '#F59E0B' }, // Yellow
    HR: { capacity: 20, color: '#8B5CF6' }, // Purple
    Finance: { capacity: 25, color: '#EC4899' }, // Pink
    Operations: { capacity: 25, color: '#6366F1' }, // Indigo
  };

  departments = [
    { name: 'Engineering', count: 45 },
    { name: 'Sales', count: 30 },
    { name: 'Marketing', count: 25 },
    { name: 'HR', count: 15 },
    { name: 'Finance', count: 20 },
    { name: 'Operations', count: 15 },
  ];

  getRecentActivities(): any[] {
    if (this.currentUser.role === UserRole.EMPLOYEE) {
      return [
        {
          action: 'Leave Request',
          details: 'Your leave request for Sept 15-16 is pending approval',
          time: '2 hours ago',
        },
        {
          action: 'Attendance Marked',
          details: 'Clock in at 9:00 AM',
          time: '8 hours ago',
        },
        {
          action: 'Payslip Generated',
          details: 'Your August payslip is ready for download',
          time: '2 days ago',
        },
        {
          action: 'Project Assignment',
          details: 'You were assigned to Project Alpha',
          time: '3 days ago',
        },
      ];
    }
    return [
      {
        action: 'New employee added',
        details: 'John Doe joined Engineering ',
        time: '2 hours ago',
      },
      {
        action: 'Leave approved',
        details: "Sarah's vacation request approved",
        time: '3 hours ago',
      },
      {
        action: 'Payslip generated',
        details: 'August payslips processed',
        time: '5 hours ago',
      },
      {
        action: 'Department update',
        details: 'New project team created',
        time: '1 day ago',
      },
    ];
  }

  get recentActivities() {
    return this.getRecentActivities();
  }

  // Chart instance
  private departmentChart: Chart | null = null;

  ngOnInit() {
    setTimeout(() => this.initializeDepartmentChart(), 0);
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

    if (this.currentUser.role === UserRole.EMPLOYEE) {
      // Employee-specific chart showing personal metrics
      this.departmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [
            'Tasks Completed',
            'Tasks In Progress',
            'Pending Reviews',
            'Leave Days Taken',
          ],
          datasets: [
            {
              data: [12, 5, 3, 8], // Sample employee metrics
              backgroundColor: [
                '#3B82F6', // Blue
                '#F59E0B', // Yellow
                '#8B5CF6', // Purple
                '#10B981', // Green
              ],
              borderRadius: 5,
            },
          ],
        },
      });
      return;
    }

    // Admin and HR view showing department distribution
    this.departmentChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.departments.map(
          (dept) =>
            `${dept.name} (${dept.count}/${
              this.departmentConfig[dept.name].capacity
            })`
        ),
        datasets: [
          {
            data: this.departments.map((dept) => dept.count),
            backgroundColor: this.departments.map(
              (dept) => this.departmentConfig[dept.name].color
            ),
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
        layout: {
          padding: 20,
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
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
            callbacks: {
              label: (context) => {
                const dept = this.departments[context.dataIndex];
                const capacity = this.departmentConfig[dept.name].capacity;
                const utilization = ((dept.count / capacity) * 100).toFixed(1);
                return [
                  `${dept.name}: ${dept.count} employees`,
                  `Capacity: ${dept.count}/${capacity} (${utilization}%)`,
                ];
              },
            },
          },
        },
      },
    });
  }

  // Admin & HR Actions
  private addEmployee(): void {
    this.router.navigate(['/employee-form']);
  }

  private manageDepartments(): void {
    this.router.navigate(['/department-form']);
  }

  private generatePayslips(): void {
this.router.navigate(['/payslip-form']);
  }

  private approveLeaves(): void {
this.router.navigate(['/leave-management']);
  }

  // Employee Actions
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
