import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NavbarComponent],
  templateUrl: './login.html'
})
export class Login {
  loginForm: FormGroup;
  error: string | null = null;
  loading = false;

  returnUrl: string = '/payslips';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get return url from route parameters or default to '/payslips'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/payslips';
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('Login successful');
          this.router.navigate([this.returnUrl]); // Navigate to the return URL
        },
        error: (error) => {
          console.error('Login error:', error);
          this.error = error.error?.message || 'Invalid email or password';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Please fill in all required fields correctly';
    }
  }
}
