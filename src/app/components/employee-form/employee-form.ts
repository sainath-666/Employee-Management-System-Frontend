import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Employee } from '../../interfaces/employee';
import { RolesService, Role } from '../../services/roles.service';
import {
  DepartmentService,
  Department,
} from '../../services/department.service';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentEmployeeService } from '../../services/department-employee.service';
import { DepartmentEmployeeRequest } from '../../interfaces/departmentemployeerequest';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.html',
  styleUrls: ['./employee-form.css'],
})
export class EmployeeForm implements OnInit, OnChanges {
  @Input() employee: Employee | null = null;
  roles: Role[] = [];
  departments: Department[] = [];
  @Input() isEditMode: boolean = false;
  @Input() isLoading: boolean = false;

  @Output() formSubmit = new EventEmitter<FormData | void>();
  @Output() formCancel = new EventEmitter<void>();

  employeeForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  selectedDepartments: number[] = [];

  departmentsControl = new FormControl<string[]>([]);

  genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  constructor(
    private fb: FormBuilder,
    private roleService: RolesService,
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
    private departmentEmployeeService: DepartmentEmployeeService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadRoles();
    this.loadDepartments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.populateForm();
    }
  }

  private loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        // Filter out any invalid roles (those without id or roleName)
        this.roles = roles.filter(
          (role) =>
            role &&
            typeof role.id === 'number' &&
            typeof role.roleName === 'string' &&
            role.roleName.trim() !== ''
        );

        // Update roleId validator to ensure only valid role IDs can be selected
        const validRoleIds = this.roles.map((r) => r.id);
        this.employeeForm.get('roleId')?.setValidators([
          Validators.required,
          Validators.pattern(/^\d+$/),
          (control: AbstractControl) => {
            const value = Number(control.value);
            return validRoleIds.includes(value) ? null : { invalidRole: true };
          },
        ]);

        // If in edit mode and we have a roleId, validate it
        if (this.isEditMode && this.employee?.roleId) {
          const roleExists = this.roles.some(
            (r) => r.id === this.employee?.roleId
          );
          if (!roleExists) {
            console.warn(
              `Employee's role (ID: ${this.employee.roleId}) no longer exists`
            );
            this.employeeForm.patchValue({ roleId: '' });
          }
        }
      },
      error: (error) => {
        if (error.status === 401) {
          console.error('Please log in to access roles');
        } else if (error.status === 404) {
          console.error('Role service endpoint not found');
        } else {
          console.error('Error loading roles:', error);
        }
        // Set roles to empty array on error
        this.roles = [];
      },
    });
  }

  private loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        // Filter out any invalid departments and sort by name
        this.departments = departments
          .filter(
            (dept) =>
              dept &&
              typeof dept.id === 'number' &&
              typeof dept.departmentName === 'string' &&
              dept.departmentName.trim() !== ''
          )
          .sort((a, b) => a.departmentName.localeCompare(b.departmentName));

        // If editing, validate selected departments
        if (this.isEditMode && this.selectedDepartments.length > 0) {
          this.selectedDepartments = this.selectedDepartments.filter((id) =>
            this.departments.some((dept) => dept.id === id)
          );
        }
      },
      error: (error) => {
        if (error.status === 401) {
          console.error('Please log in to access departments');
        } else {
          console.error('Error loading departments:', error);
        }
        // Set departments to empty array on error
        this.departments = [];
      },
    });
  }

  private initializeForm(): void {
    this.employeeForm = this.fb.group({
      employeeCode: [
        '',
        [
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern(/^[A-Za-z0-9]+$/),
        ],
      ],
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
          Validators.pattern(/^[a-zA-Z\s]+$/),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(150)],
      ],
      mobileNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{10,15}$/),
          Validators.maxLength(15),
        ],
      ],
      gender: ['', Validators.required],
      dob: [''],
      roleId: [
        '',
        [
          Validators.required,
          (control: AbstractControl) => {
            const value = control.value;
            if (!value) return null;
            const numValue = Number(value);
            return !isNaN(numValue) && Number.isInteger(numValue)
              ? null
              : { invalidRole: true };
          },
        ],
      ],
      // password: [''],
      status: [true],
    });

    // Set password as required for create mode
    // if (!this.isEditMode) {
    //   this.employeeForm.get('password')?.setValidators([
    //     Validators.required,
    //     Validators.minLength(8),
    //     Validators.pattern(/^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[@$!%?&])[A-Za-z\d@$!%?&]/)
    //   ]);
    // } else {
    //   this.employeeForm.get('password')?.setValidators([
    //     Validators.minLength(8),
    //     Validators.pattern(/^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[@$!%?&])[A-Za-z\d@$!%?&]/)
    //   ]);
    // }
  }

  private populateForm(): void {
    if (this.employee) {
      this.employeeForm.patchValue({
        employeeCode: this.employee.employeeCode,
        name: this.employee.name,
        email: this.employee.email,
        mobileNumber: this.employee.mobileNumber,
        gender: this.employee.gender,
        dob: this.employee.dob
          ? new Date(this.employee.dob).toISOString().split('T')[0]
          : '',
        roleId: this.employee.roleId,

        // password: '',

        status: this.employee.status ?? true,
      });

      this.selectedDepartments = this.employee.departments || [];

      if (this.employee.profilePhotoPath) {
        this.previewUrl = this.employee.profilePhotoPath;
      }
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      // Validate file type

      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (2MB limit)

      if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        return;
      }

      this.selectedFile = file;

      // Create preview

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
    const fileInput = document.getElementById(
      'profilePhoto'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onDepartmentSelectionChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const departmentId = Number(target.value);
    const isChecked = target.checked;

    if (isChecked) {
      if (!this.selectedDepartments.includes(departmentId)) {
        this.selectedDepartments.push(departmentId);
      }
    } else {
      this.selectedDepartments = this.selectedDepartments.filter(
        (id) => id !== departmentId
      );
    }

    // Keep departments sorted by name when displaying
    this.selectedDepartments.sort((a, b) => {
      const deptA = this.departments.find((d) => d.id === a);
      const deptB = this.departments.find((d) => d.id === b);
      return deptA && deptB
        ? deptA.departmentName.localeCompare(deptB.departmentName)
        : 0;
    });
  }

  isDepartmentSelected(departmentId: number): boolean {
    return this.selectedDepartments.includes(departmentId);
  }

  isAllDepartmentsSelected(): boolean {
    return (
      this.departments.length > 0 &&
      this.selectedDepartments.length === this.departments.length
    );
  }

  getSelectedDepartmentNames(): string[] {
    return this.selectedDepartments
      .map(
        (id) => this.departments.find((dept) => dept.id === id)?.departmentName
      )
      .filter((name): name is string => !!name);
  }

  onSubmit(): void {
    if (this.employeeForm.valid && this.selectedDepartments.length > 0) {
      if (this.isEditMode && this.employee?.id) {
        // Update existing employee
        this.handleUpdateEmployee();
      } else {
        // Create new employee
        this.handleCreateEmployee();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  successMessage: string = '';
  errorMessage: string = '';

  private handleCreateEmployee(): void {
    const formData = this.createFormData(); // Use FormData instead of raw form value
    this.employeeService.createEmployee(formData).subscribe({
      next: (response) => {
        if (response && response.id) {
          // After employee is created, assign departments
          this.assignDepartmentsToEmployee(response.id);
          this.successMessage = 'Employee created successfully!';
          setTimeout(() => (this.successMessage = ''), 3000); // Clear after 3 seconds
        } else {
          this.errorMessage = 'Invalid response from server';
          setTimeout(() => (this.errorMessage = ''), 3000);
        }
      },
      error: (error) => {
        console.error('Error creating employee:', error);
        const raw =
          error?.error && typeof error.error === 'string' ? error.error : '';
        if (raw.includes('UNIQUE KEY') || raw.includes('2627')) {
          this.errorMessage =
            'Employee code already exists. Please use a different code.';
        } else {
          this.errorMessage = error.error?.message || 'Error creating employee';
        }
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  private handleUpdateEmployee(): void {
    if (!this.employee?.id) return;

    const formData = this.createFormData(); // Use FormData instead of raw form value
    this.employeeService.updateEmployee(this.employee.id, formData).subscribe({
      next: (response) => {
        if (response && this.employee?.id) {
          // After employee is updated, update department assignments
          this.assignDepartmentsToEmployee(this.employee.id);
          this.successMessage = 'Employee updated successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
        } else {
          this.errorMessage = 'Invalid response from server';
          setTimeout(() => (this.errorMessage = ''), 3000);
        }
      },
      error: (error) => {
        console.error('Error updating employee:', error);
        const raw =
          error?.error && typeof error.error === 'string' ? error.error : '';
        if (raw.includes('UNIQUE KEY') || raw.includes('2627')) {
          this.errorMessage =
            'Employee code already exists. Please use a different code.';
        } else {
          this.errorMessage = error.error?.message || 'Error updating employee';
        }
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  private assignDepartmentsToEmployee(employeeId: number): void {
    const validDepartmentIds = this.selectedDepartments.filter((id) =>
      this.departments.some((dept) => dept.id === id)
    );

    const departmentRequest: DepartmentEmployeeRequest = {
      employeeId: employeeId,
      departmentIds: validDepartmentIds,
    };

    this.departmentEmployeeService
      .assignDepartments(departmentRequest)
      .subscribe({
        next: (response) => {
          // response will be a string message
          this.successMessage = 'Employee and departments saved successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
          this.formSubmit.emit();
        },
        error: (error) => {
          // Only treat actual HTTP errors as errors
          if (error.status !== 200) {
            if (error.status === 400) {
              this.errorMessage = 'Invalid department assignment';
            } else if (error.status === 404) {
              this.errorMessage = 'Employee or department not found';
            } else {
              this.errorMessage = 'Error assigning departments';
            }
            console.error('Error assigning departments:', error);
            setTimeout(() => (this.errorMessage = ''), 3000);
          } else {
            // If status is 200 but we got a parse error, treat it as success
            this.successMessage =
              'Employee and departments saved successfully!';
            setTimeout(() => (this.successMessage = ''), 3000);
            this.formSubmit.emit();
          }
        },
      });
  } // inside EmployeeFormComponent class
  isDropdownOpen = false;

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onDepartmentChange(event: Event, departmentId: number): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedDepartments.includes(departmentId)) {
        this.selectedDepartments.push(departmentId);
      }
    } else {
      this.selectedDepartments = this.selectedDepartments.filter(
        (id) => id !== departmentId
      );
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedDepartments = this.departments.map((d) => d.id);
    } else {
      this.selectedDepartments = [];
    }
  }

  private createFormData(): any {
    const formData = new FormData();

    // Add form fields
    Object.keys(this.employeeForm.value).forEach((key) => {
      const value = this.employeeForm.value[key];
      if (value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    // Default password as mobile number on create
    if (!this.isEditMode) {
      const mobile = this.employeeForm.get('mobileNumber')?.value || '';
      if (mobile) {
        formData.append('password', mobile);
      }
    }

    // Add selected departments
    this.selectedDepartments.forEach((deptId) => {
      formData.append('departmentIds', deptId.toString());
    });

    // Add file if selected
    if (this.selectedFile) {
      formData.append('profilePhoto', this.selectedFile);
    }

    // Add employee ID for edit mode
    if (this.isEditMode && this.employee?.id) {
      formData.append('id', this.employee.id.toString());
    }

    return formData;
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.employeeForm.controls).forEach((key) => {
      this.employeeForm.get(key)?.markAsTouched();
    });
  }

  // ---------------- Error Helpers ----------------
  getFieldError(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    if (field?.errors && field.touched) {
      const errors = field.errors;
      if (errors['required'])
        return `${this.getFieldLabel(fieldName)} is required`;
      if (errors['email']) return 'Please enter a valid email address';
      if (errors['pattern']) {
        switch (fieldName) {
          case 'employeeCode':
            return 'Employee code should contain only letters and numbers';
          case 'name':
            return 'Name should contain only letters and spaces';
          case 'mobileNumber':
            return 'Please enter a valid mobile number';
          case 'roleId':
            return 'Please select a valid role';
          case 'password':
            return 'Password must contain at least 8 characters with uppercase, lowercase, number and special character';
          default:
            return 'Invalid format';
        }
      }
      if (errors['maxLength'])
        return `${this.getFieldLabel(fieldName)} is too long`;
      if (errors['minLength'])
        return `${this.getFieldLabel(fieldName)} is too short`;

      if (errors['invalidRole']) return 'Please select a valid role';
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
      roleId: 'Role',
      // password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}
