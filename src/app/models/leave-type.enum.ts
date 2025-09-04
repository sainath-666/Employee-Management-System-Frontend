export enum LeaveType {
  Sick = 1,
  Casual = 2,
  Earned = 3,
  Maternity = 4,
  Paternity = 5,
  Other = 6,
}

export const LeaveTypeLabels: Record<LeaveType, string> = {
  [LeaveType.Sick]: 'Sick Leave',
  [LeaveType.Casual]: 'Casual Leave',
  [LeaveType.Earned]: 'Earned Leave',
  [LeaveType.Maternity]: 'Maternity Leave',
  [LeaveType.Paternity]: 'Paternity Leave',
  [LeaveType.Other]: 'Other Leave',
};
