
export interface DepartmentEmployeeRequest {
  employeeId: number;         
  departmentIds: number[];    
  createdBy?: number;
  createdDateTime?: string;  
  updatedBy?: number;
  updatedDateTime?: string;
}