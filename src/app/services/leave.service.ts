import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { LeaveType } from '../models/leave-type.enum';
import { Status } from '../models/status.enum';
import { LeaveTypeEnum } from '../models/leaveTypeEnum';
import { StatusEnum } from '../models/statusEnum';

export interface LeaveRequest {
     id: number;
    employeeId: number;
    leaveTypeID?: LeaveTypeEnum;   // nullable enum → optional
    startDate?: string | Date;            // DateTime? → optional string
    endDate?: string | Date;
    maxDaysPerYear?: number;
    reason: string;
    status: StatusEnum;            // always required (defaults from backend)
    createdBy?: number;
    createdDateTime: string;       // DateTime → string
    updatedBy?: number;
    updatedDateTime?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  private apiUrl = `${environment.apiUrl}/api/Leave`;

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
    const rawType = (request.leaveTypeID ?? request.leaveTypeID) as number | string | undefined;
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
      createdDateTime: request.createdDateTime ? new Date(request.createdDateTime).toISOString() : new Date().toISOString(),
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
