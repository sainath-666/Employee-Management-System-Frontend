import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { LeaveType } from '../models/leave-type.enum';
import { Status } from '../models/status.enum';

export interface LeaveRequest {
  id: number;
  employeeId?: number;
  employeeName: string;
  department: string;
  type?: LeaveType | string | number;
  leaveType?: LeaveType | string | number; // alternative property name
  startDate: string;
  endDate: string;
  maxDaysPerYear?: number | null;
  reason: string;
  status: Status;
  appliedOn: string;
  actionDate?: string;
  actionBy?: string;
  comments?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  private apiUrl = `${environment.apiUrl}/Leave`;

  constructor(private http: HttpClient) {}

  // Get all leave requests
  getAllLeaveRequests(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(this.apiUrl);
  }

  // Get leave requests by employee ID
  getLeaveRequestsByEmployee(employeeId: number): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(
      `${this.apiUrl}/employee/${employeeId}`
    );
  }

  // Create a new leave request
  createLeaveRequest(
    leaveRequest: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>
  ): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(this.apiUrl, leaveRequest);
  }

  // Update leave request status
  updateLeaveStatus(
    request: LeaveRequest,
    status: 'Approved' | 'Rejected',
    actionById: number
  ): Observable<any> {
    // Map UI model to backend expected payload
    const statusValue = status === 'Approved' ? 1 : 2;

    // Normalize type value to number for LeaveTypeID (backend enum)
    const rawType = (request.type ?? request.leaveType) as number | string | undefined;
    const leaveTypeID =
      typeof rawType === 'string' ? parseInt(rawType, 10) : typeof rawType === 'number' ? rawType : 1;

    const payload = {
      id: request.id,
      employeeId: request.employeeId ?? 1,
      leaveTypeID: leaveTypeID,
      startDate: request.startDate,
      endDate: request.endDate,
      maxDaysPerYear: request.maxDaysPerYear ?? null,
      reason: request.reason,
      status: statusValue,
      createdBy: null,
      createdDateTime: request.appliedOn ? new Date(request.appliedOn).toISOString() : new Date().toISOString(),
      updatedBy: actionById,
      updatedDateTime: new Date().toISOString(),
    } as any;

    console.log('Leave PUT payload', payload);

    // Some backends return text/plain; accept it without failing JSON parsing
    return this.http.put(`${this.apiUrl}/${request.id}`, payload);
  }

  // Delete a leave request
  deleteLeaveRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
