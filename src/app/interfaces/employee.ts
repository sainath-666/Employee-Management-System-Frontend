export interface Employee {
  id?: number;
  employeeCode: string;
  name: string;
  email: string;
  mobileNumber: string;
  gender: string;
  dob?: string; 
  profilePhotoPath?: string;
  roleId: number;
  // password?: string;
  status?: boolean;
  departments?: number[];
}