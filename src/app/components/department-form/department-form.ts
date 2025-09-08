import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../services/department.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-department-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './department-form.html',
  styleUrl: './department-form.css',
})
export class DepartmentForm implements OnInit {
  departmentForm!: FormGroup;
  departments: Department[] = [];
  showDeptForm = false; // controls modal visibility

  constructor(private fb: FormBuilder, private departmentService: DepartmentService,private authService:AuthService) {}

  ngOnInit() {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      status: [true, Validators.required],
    });
    
    this.loadDepartments();
  }

  loadDepartments() {
    this.departmentService.getAllDepartments().subscribe({
      next: (data) =>{ (this.departments = data);
         console.log(this.departments);
      },
      error: (err) => console.error('Error fetching departments:', err),
    });
  }
  editingDeptId?:number;
  editDept(dept: Department) {
  this.showDeptForm = true; // open modal
   this.editingDeptId = dept.id; // store id for update

  // Fill form with current values
  this.departmentForm.patchValue({
    name: dept.departmentName,
    status: dept.status,
  });
}


  deleteDept(id:number){
    console.log('clicked')
    this.departmentService.deleteDepartment(id).subscribe({
      next: () => {
        console.log('Department deleted successfully');
        this.loadDepartments(); // refresh the list
      },
      error: (err) => console.error('Error deleting department:', err),
    });
  }

  private resetForm() {
  this.showDeptForm = false;
  
  this.departmentForm.reset({ name: '', status: true });// default Active
}
 
onSubmit() {
  if (this.departmentForm.valid) {
    const formValue = this.departmentForm.value;
    const employeeId = this.authService.getCurrentEmployeeId();

    if (!employeeId) {
      console.log('User not authenticated. Please login again.');
      return;
    }

    // Build Department object
    const department: Department = {
      id: this.editingDeptId ?? 0, // if editing, use ID; else backend will generate
      departmentName: formValue.name,
       status: !!formValue.status, 
      createdBy: employeeId,
      createdDateTime: new Date().toISOString(),
      updatedBy: employeeId,
      updatedDateTime: new Date().toISOString(),
    };

    if (this.editingDeptId) {
      // 🔹 UPDATE logic
      this.departmentService.updateDepartment(this.editingDeptId, department).subscribe({
        next: () => {
          console.log('Department updated successfully');
          this.loadDepartments();
          this.resetForm();
        },
        error: (err) => console.error('Error updating department:', err),
      });
    } else {
      // 🔹 ADD logic
      this.departmentService.addDepartment(department).subscribe({
        next: () => {
          console.log('Department added successfully');
          this.loadDepartments();
          this.resetForm();
        },
        error: (err) => console.error('Error adding department:', err),
      });
    }
  } else {
    this.markFormGroupTouched(this.departmentForm);
  }
}




  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
