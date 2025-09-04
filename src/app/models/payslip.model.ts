export interface Payslip {
    id?: number;
    employeeId: number;
    month: string;
    year: number;
    Salary: number;
    BaseSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    pdfPath?: string;
    createdBy?: number; // HR's employee ID who created the payslip (optional for fetching)
}
