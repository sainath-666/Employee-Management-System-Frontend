import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface ActionDialogData {
  action: 'approve' | 'reject';
  leaveId: number;
}

@Component({
  selector: 'app-leave-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.action === 'approve' ? 'Approve' : 'Reject' }} Leave Request
    </h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Comments</mat-label>
        <textarea
          matInput
          [(ngModel)]="comments"
          rows="4"
          placeholder="Enter your comments..."
        ></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onConfirm()"
        [disabled]="!comments"
      >
        {{ data.action === 'approve' ? 'Approve' : 'Reject' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
        min-width: 300px;
      }
      mat-dialog-content {
        padding-top: 20px;
      }
    `,
  ],
})
export class LeaveActionDialogComponent {
  comments: string = '';

  constructor(
    public dialogRef: MatDialogRef<LeaveActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActionDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.comments);
  }
}
