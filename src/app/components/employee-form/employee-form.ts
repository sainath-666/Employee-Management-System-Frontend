import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Employee } from '../../interfaces/employee';

export interface Role {
  id: number;
  roleName: string;
  status: boolean;
}

export interface Department {
  id: number;
  departmentName: string;
  status: boolean;
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.html',
  styleUrls: ['./employee-form.css']
})
export class EmployeeFormComponent implements OnInit, OnChanges {
  @Input() employee: Employee | null = null;
  // TODO: Remove these dummy data when implementing with real database
  @Input() roles: Role[] = [
    // { id: 1, roleName: 'Developer', status: true },
    // { id: 2, roleName: 'Team Lead', status: true },
    // { id: 3, roleName: 'Project Manager', status: true },
    // { id: 4, roleName: 'HR Manager', status: true },
    // { id: 5, roleName: 'Quality Analyst', status: true },
    // { id: 6, roleName: 'Inactive Role', status: false } // This won't show up due to status check
  ];

  @Input() departments: Department[] = [
    // { id: 1, departmentName: 'Engineering', status: true },
    // { id: 2, departmentName: 'Human Resources', status: true },
    // { id: 3, departmentName: 'Quality Assurance', status: true },
    // { id: 4, departmentName: 'Product Management', status: true },
    // { id: 5, departmentName: 'Operations', status: true },
    // { id: 6, departmentName: 'Finance', status: true },
    // { id: 7, departmentName: 'Inactive Department', status: false } // This won't show up due to status check
  ];

  @Input() isEditMode: boolean = false;
  @Input() isLoading: boolean = false;

  @Output() formSubmit = new EventEmitter<FormData>();
  @Output() formCancel = new EventEmitter<void>();

  employeeForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  selectedDepartments: number[] = [];
  isDropdownOpen: boolean = false;

  genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.populateForm();
    }
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      employeeCode: ['', [
        Validators.required,
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z0-9]+$/)
      ]],
      name: ['', [
        Validators.required,
        Validators.maxLength(150),
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(150)
      ]],
      mobileNumber: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10,15}$/),
        Validators.maxLength(15)
      ]],
      gender: ['', Validators.required],
      dob: [''],
      roleId: ['', Validators.required],
      status: [true] // Initialize as active by default for both create and edit
    });
  }

  private populateForm(): void {
    if (this.employee) {
      this.employeeForm.patchValue({
        employeeCode: this.employee.employeeCode,
        name: this.employee.name,
        email: this.employee.email,
        mobileNumber: this.employee.mobileNumber,
        gender: this.employee.gender,
        dob: this.employee.dob ? new Date(this.employee.dob).toISOString().split('T')[0] : '',
        roleId: this.employee.roleId,
        status: this.employee.status ?? true
      });

      this.selectedDepartments = this.employee.departments || [];
      
      if (this.employee.profilePhotoPath) {
        this.previewUrl = this.employee.profilePhotoPath;
      }
    }
  }

  // ---------------- File Upload ----------------
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    const fileInput = document.getElementById('profilePhoto') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // ---------------- Department Dropdown ----------------
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleDepartment(departmentId: number): void {
    const index = this.selectedDepartments.indexOf(departmentId);
    if (index > -1) {
      this.selectedDepartments.splice(index, 1);
    } else {
      this.selectedDepartments.push(departmentId);
    }
  }

  toggleSelectAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedDepartments = this.departments
        .filter(d => d.status)
        .map(d => d.id);
    } else {
      this.selectedDepartments = [];
    }
  }

  areAllDepartmentsSelected(): boolean {
    const activeDepts = this.departments.filter(d => d.status).map(d => d.id);
    return activeDepts.length > 0 && activeDepts.every(id => this.selectedDepartments.includes(id));
  }

  onDepartmentChange(event: Event, departmentId: number): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedDepartments.includes(departmentId)) {
        this.selectedDepartments.push(departmentId);
      }
    } else {
      const index = this.selectedDepartments.indexOf(departmentId);
      if (index > -1) {
        this.selectedDepartments.splice(index, 1);
      }
    }
  }

  isDepartmentSelected(departmentId: number): boolean {
    return this.selectedDepartments.includes(departmentId);
  }

  getSelectedDepartmentNames(): string[] {
    return this.departments
      .filter(d => this.selectedDepartments.includes(d.id))
      .map(d => d.departmentName);
  }

  // ---------------- Form Submit ----------------
  onSubmit(): void {
    if (this.employeeForm.valid && this.selectedDepartments.length > 0) {
      const formData = new FormData();

      Object.keys(this.employeeForm.value).forEach(key => {
        const value = this.employeeForm.value[key];
        if (value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      this.selectedDepartments.forEach(deptId => {
        formData.append('departmentIds', deptId.toString());
      });

      if (this.selectedFile) {
        formData.append('profilePhoto', this.selectedFile);
      }

      if (this.isEditMode && this.employee?.id) {
        formData.append('id', this.employee.id.toString());
      }

      // TODO: Remove this console.log when implementing with real database
      // console.log('Form Data Preview:', {
      //   formValues: this.employeeForm.value,
      //   selectedDepartments: this.selectedDepartments,
      //   selectedDepartmentNames: this.getSelectedDepartmentNames(),
      //   file: this.selectedFile ? 'File selected' : 'No file'
      // });

      this.formSubmit.emit(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.employeeForm.controls).forEach(key => {
      this.employeeForm.get(key)?.markAsTouched();
    });
  }

  // ---------------- Error Helpers ----------------
  getFieldError(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    if (field?.errors && field.touched) {
      const errors = field.errors;

      if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (errors['email']) return 'Please enter a valid email address';
      if (errors['pattern']) {
        switch (fieldName) {
          case 'employeeCode': return 'Employee code should contain only letters and numbers';
          case 'name': return 'Name should contain only letters and spaces';
          case 'mobileNumber': return 'Please enter a valid mobile number';
          case 'password': return 'Password must contain at least 8 characters with uppercase, lowercase, number and special character';
          default: return 'Invalid format';
        }
      }
      if (errors['maxLength']) return `${this.getFieldLabel(fieldName)} is too long`;
      if (errors['minLength']) return `${this.getFieldLabel(fieldName)} is too short`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      employeeCode: 'Employee Code',
      name: 'Name',
      email: 'Email',
      mobileNumber: 'Mobile Number',
      gender: 'Gender',
      dob: 'Date of Birth',
      roleId: 'Role'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}
