import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PayslipForm } from './payslip-form';

describe('PayslipForm', () => {
  let component: PayslipForm;
  let fixture: ComponentFixture<PayslipForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PayslipForm,
        HttpClientModule,
        RouterTestingModule,
        ReactiveFormsModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayslipForm);
    component = fixture.componentInstance;
    
    // Initialize form before detection
    component.payslipForm?.patchValue({
      name: 'Test Employee',
      empId: '123',
      payPeriod: 'September 2025',
      totalSalary: 50000,
      baseSalary: 40000,
      allowances: 10000,
      deductions: 5000
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
