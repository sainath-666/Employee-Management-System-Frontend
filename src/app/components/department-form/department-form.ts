import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-department-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './department-form.html',
  styleUrl: './department-form.css',
})
export class DepartmentForm implements OnInit {
  departmentForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      status: ['active', Validators.required],
    });
  }

  onSubmit() {
    if (this.departmentForm.valid) {
      console.log('Department form submitted:', this.departmentForm.value);
      // TODO: Add API call to save department
    } else {
      this.markFormGroupTouched(this.departmentForm);
    }
  }

  // Helper method to mark all controls as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
