export interface Department {
  id: number;
  departmentName: string;
  status: boolean;
  createdBy?: number | null;
  createdDateTime?: string;
  updatedBy?: number | null;
  updatedDateTime?: string | null;
}
