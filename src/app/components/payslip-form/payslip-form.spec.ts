import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayslipForm } from './payslip-form';

describe('PayslipForm', () => {
  let component: PayslipForm;
  let fixture: ComponentFixture<PayslipForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayslipForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayslipForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
