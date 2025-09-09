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
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Employee } from '../../interfaces/employee';
import { RolesService, Role } from '../../services/roles.service';
import {
  DepartmentService,
  Department,
} from '../../services/department.service';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentEmployeeService } from '../../services/department-employee.service';
import { DepartmentEmployeeRequest } from '../../interfaces/departmentemployeerequest';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './employee-form.html',
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
  private initialDepartmentIds: number[] = [];

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
    private departmentEmployeeService: DepartmentEmployeeService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private location:Location
  ) {
    this.initializeForm();
  }

  goBack(): void {
    this.location.back();  // 🔹 Goes to previous page in history
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadRoles();
    this.loadDepartments();

    // Check if we're editing an existing employee
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        // Load employee details
        this.isLoading = true;
        this.employeeService.getEmployeeById(parseInt(id, 10)).subscribe({
          next: (employee) => {
            this.employee = employee;
            this.populateForm();
            // Load employee departments
            this.departmentEmployeeService
              .getDepartmentsForEmployee(parseInt(id, 10))
              .subscribe({
                next: (departments) => {
                  const ids = departments.map((d) => d.id);
                  this.selectedDepartments = Array.from(new Set(ids));
                  this.initialDepartmentIds = [...this.selectedDepartments];
                  this.isLoading = false;
                },
                error: (error) => {
                  console.error('Error loading departments:', error);
                  this.isLoading = false;
                },
              });
          },
          error: (error) => {
            console.error('Error loading employee:', error);
            this.isLoading = false;
          },
        });
      }
    });
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
    const currentUserId = this.authService.getCurrentEmployeeId();
    const isOwnProfile = this.isEditMode && currentUserId === this.employee?.id;

    this.employeeForm = this.fb.group({
      employeeCode: [
        {
          value: '',
          disabled: isOwnProfile,
        },
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
        {
          value: '',
          disabled: isOwnProfile,
        },
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
      status: [
        {
          value: true,
          disabled: isOwnProfile,
        },
      ],
      password: ['']
    });

    // No validators for password; optional in edit, hidden in create
  }

  private populateForm(): void {
    if (this.employee) {
      const currentUserId = this.authService.getCurrentEmployeeId();
      const isOwnProfile = currentUserId === this.employee.id;

      // Keep original form control states
      const employeeCode = this.employeeForm.get('employeeCode');
      const roleId = this.employeeForm.get('roleId');
      const status = this.employeeForm.get('status');

      // Disable fields if it's own profile
      if (isOwnProfile) {
        employeeCode?.disable();
        roleId?.disable();
        status?.disable();
      }

      // Set form values
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
        status: this.employee.status ?? true,
      });

      if (this.employee.profilePhotoPath) {
        this.previewUrl = this.employeeService.imageApiUrl + this.employee.profilePhotoPath;
      }
    }
  }

  private loadEmployeeDetails(id: number): void {
    this.isLoading = true;
    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee) => {
        this.employee = employee;
        this.populateForm();

        // Load employee departments
        this.departmentEmployeeService.getDepartmentsForEmployee(id).subscribe({
          next: (departments) => {
            const ids = departments.map((d) => d.id);
            this.selectedDepartments = Array.from(new Set(ids));
            this.initialDepartmentIds = [...this.selectedDepartments];
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading departments:', error);
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.isLoading = false;
      },
    });
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
    this.markFormGroupTouched();

    if (!this.employeeForm.valid) {
      console.log('Form Validation Errors:', this.getFormValidationErrors());
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    if (this.selectedDepartments.length === 0) {
      this.errorMessage = 'Please select at least one department.';
      return;
    }

    const roleId = this.employeeForm.get('roleId')?.value;
    if (!roleId) {
      this.errorMessage = 'Please select a role.';
      return;
    }

    if (this.isEditMode && this.employee?.id) {
      // Update existing employee
      this.handleUpdateEmployee();
    } else {
      // Create new employee
      this.handleCreateEmployee();
    }
  }

  successMessage: string = '';
  errorMessage: string = '';

  private handleCreateEmployee(): void {
    const formData = this.createFormData(); // Use FormData instead of raw form value
    this.employeeService.createEmployee(formData).subscribe({
      next: (response) => {
        console.log('Create employee response:', response); // Debug log
        if (response && response.id) {
          // Get the form values
          const formValues = this.employeeForm.getRawValue();
          
          // After employee is created, assign departments
          this.assignDepartmentsToEmployee(response.id);
          this.successMessage = 'Employee created successfully!';
          // Show success message then navigate to payslip form
          setTimeout(() => {
            this.successMessage = '';
            // Navigate to payslip form with employee details
            console.log('Navigating to payslip form with params:', {
              employeeId: response.id,
              employeeName: formValues.name
            }); // Debug log
            this.router.navigate(['/payslip-form'], {
              queryParams: {
                employeeId: response.id,
                employeeName: formValues.name
              }
            });
          }, 1500);
        } else {
          this.errorMessage = 'Invalid response from server';
          setTimeout(() => (this.errorMessage = ''), 3000);
        }
      },
      error: (error) => {
        console.error('Error creating employee:', error);
        console.log('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
        });

        if (error.error && typeof error.error === 'object') {
          // Handle validation errors
          const validationErrors = [];
          for (const key in error.error.errors) {
            validationErrors.push(
              `${key}: ${error.error.errors[key].join(', ')}`
            );
          }
          if (validationErrors.length > 0) {
            this.errorMessage = `Validation errors: ${validationErrors.join(
              '; '
            )}`;
          } else {
            this.errorMessage =
              error.error.message || 'Error creating employee';
          }
        } else {
          const raw =
            error?.error && typeof error.error === 'string' ? error.error : '';
          if (raw.includes('UNIQUE KEY') || raw.includes('2627')) {
            this.errorMessage =
              'Employee code already exists. Please use a different code.';
          } else {
            this.errorMessage =
              error.error?.message || 'Error creating employee';
          }
        }
        setTimeout(() => (this.errorMessage = ''), 5000);
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
          // Show success message then navigate
          setTimeout(() => {
            this.successMessage = '';
            this.router.navigate(['/dashboard']);
          }, 1500);
        } else {
          this.errorMessage = 'Invalid response from server';
          setTimeout(() => (this.errorMessage = ''), 3000);
        }
      },
      error: (error) => {
        console.error('Error updating employee:', error);
        const errorMessage = error?.error?.message || error?.error;
        const raw = typeof errorMessage === 'string' ? errorMessage : '';

        if (raw.includes('UNIQUE KEY') || raw.includes('2627')) {
          this.errorMessage =
            'Employee code already exists. Please use a different code.';
        } else if (raw.includes('Unauthorized') || error.status === 401) {
          this.errorMessage = 'You are not authorized to make these changes.';
        } else if (raw.includes('Invalid data') || error.status === 400) {
          this.errorMessage = 'Please check the form data and try again.';
        } else {
          this.errorMessage = 'Error updating profile. Please try again later.';
        }

        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  private assignDepartmentsToEmployee(employeeId: number): void {
    const validDepartmentIds = this.selectedDepartments.filter((id) =>
      this.departments.some((dept) => dept.id === id)
    );
    const uniqueDepartmentIds = Array.from(new Set(validDepartmentIds));

    // In edit mode, if nothing changed, skip reassign
    if (this.isEditMode) {
      const a = [...uniqueDepartmentIds].sort((x, y) => x - y);
      const b = [...this.initialDepartmentIds].sort((x, y) => x - y);
      const equal = a.length === b.length && a.every((v, i) => v === b[i]);
      if (equal) {
        this.formSubmit.emit();
        return;
      }
    }

    const departmentRequest: DepartmentEmployeeRequest = {
      employeeId: employeeId,
      departmentIds: uniqueDepartmentIds,
    };

    this.departmentEmployeeService
      .assignDepartments(departmentRequest)
      .subscribe({
        next: (response) => {
          // response will be a string message
          this.successMessage = 'Employee and departments saved successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
          this.formSubmit.emit();
          // Update baseline after successful assignment
          this.initialDepartmentIds = [...uniqueDepartmentIds];
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

  private createFormData(): FormData {
    const formData = new FormData();

    // Use getRawValue() to get all form values including disabled fields
    const formValue = this.employeeForm.getRawValue();

    // Add form fields to FormData
    Object.keys(formValue).forEach((key) => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'dob' && value) {
          // Convert date to ISO string for backend
          formData.append(key, new Date(value).toISOString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Default password as mobile number on create
    if (!this.isEditMode) {
      const mobile = formValue.mobileNumber;

      const formValues = this.employeeForm.value;

      // Add required fields first
      formData.append('employeeCode', formValues.employeeCode || '');
      formData.append('name', formValues.name || '');
      formData.append('email', formValues.email || '');
      formData.append('mobileNumber', formValues.mobileNumber || '');
      formData.append('gender', formValues.gender || '');
      formData.append('roleId', formValues.roleId?.toString() || '');

      // Add optional fields
      if (formValues.dob) {
        formData.append('dob', formValues.dob);
      }

      // Add status
      formData.append('status', (formValues.status ?? true).toString());

      if (mobile) {
        formData.append('password', mobile);
      }
    }

    // Add departments as a JSON string
    if (this.selectedDepartments && this.selectedDepartments.length > 0) {
      formData.append(
        'departmentIds',
        JSON.stringify(this.selectedDepartments)
      );
    }

    // Add profile photo if selected
    if (this.selectedFile) {
      formData.append('profilePhoto', this.selectedFile);
    }

    // Log the data being sent
    console.log('Form Values:', formValue);
    console.log('Selected Departments:', this.selectedDepartments);

    // Log each key-value pair in FormData
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    }); // Add selected departments
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
    this.router.navigate(['/dashboard']);
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

  private getFormValidationErrors(): string[] {
    const errors: string[] = [];
    Object.keys(this.employeeForm.controls).forEach((key) => {
      const control = this.employeeForm.get(key);
      if (control?.errors) {
        Object.keys(control.errors).forEach((errorKey) => {
          let errorMessage = `${this.getFieldLabel(key)}: `;
          switch (errorKey) {
            case 'required':
              errorMessage += 'This field is required';
              break;
            case 'email':
              errorMessage += 'Invalid email format';
              break;
            case 'pattern':
              errorMessage += 'Invalid format';
              break;
            case 'invalidRole':
              errorMessage += 'Please select a valid role';
              break;
            default:
              errorMessage += 'Invalid value';
          }
          errors.push(errorMessage);
        });
      }
    });
    return errors;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}
