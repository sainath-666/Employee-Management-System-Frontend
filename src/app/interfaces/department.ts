export interface Department {
  id: number;
  departmentName: string;
  status: boolean;
  createdBy?: number;
  createdDateTime: string;   // DateTime → ISO string
  updatedBy?: number;
  updatedDateTime?: string;
}