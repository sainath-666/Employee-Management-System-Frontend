import { LeaveTypeEnum } from "../models/leaveTypeEnum";
import { StatusEnum } from "../models/statusEnum";

export interface Leave {
  id: number;
  employeeId: number;
  leaveTypeID?: LeaveTypeEnum;   // nullable enum → optional
  startDate?: string;            // DateTime? → optional string
  endDate?: string;
  maxDaysPerYear?: number;
  reason: string;
  status: StatusEnum;            // always required (defaults from backend)
  createdBy?: number;
  createdDateTime: string;       // DateTime → string
  updatedBy?: number;
  updatedDateTime?: string;
}