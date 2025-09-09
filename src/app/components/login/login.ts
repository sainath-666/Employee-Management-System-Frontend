import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false; //
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,

    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm && !this.loginForm.valid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        if (response && response.token) {
          this.authService.setToken(response.token);
          const redirectRoute = this.authService.getRoleBasedRoute();
          console.log('Redirecting to:', redirectRoute);
          this.router
            .navigate([redirectRoute])
            .then(() => {
              console.log('Navigation complete');
            })
            .catch((err) => {
              console.error('Navigation error:', err);
            });
        } else {
          this.errorMessage = 'Invalid response from server';
        }
      },
      error: (error: any) => {
        this.errorMessage = "Invalid email or password.";
        console.error('Login error:', error);
      },
    });
  }
}
