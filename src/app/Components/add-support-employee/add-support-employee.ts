import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup
} from '@angular/forms';
import { Router } from '@angular/router';

import { TicketsService } from '../../../services/tickets-service';
import { CreateSupportEmployeeRequest } from '../../models/create-support-employee';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-add-support-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './add-support-employee.html',
  styleUrl: './add-support-employee.css',
})
export class AddSupportEmployeeComponent {

  loading = false;
  error = '';
  success = '';

  form!: FormGroup;


  selectedImage: File | null = null;

  constructor(
    private fb: FormBuilder,
    private tickets: TicketsService,
    private router: Router
  ) {
    this.form = this.fb.group({
      // ===== Users table =====
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      address: [''],
      dateOfBirth: [''],

     
      // imageUrl: [''],

      userName: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],

      // ===== EmployeeProfile =====
      employeeCode: [''],
      hireDate: [''],
      salary: [0],

      //  default = EmployeeSupport
      jobTitle: [1],
    });
  }

 
  onImageSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;

    if (!file) {
      this.selectedImage = null;
      return;
    }

    // optional client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.error = 'Invalid image type. Use JPG/PNG/WebP.';
      this.selectedImage = null;
      input.value = '';
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.error = 'Image is too large (max 2MB).';
      this.selectedImage = null;
      input.value = '';
      return;
    }

    this.error = '';
    this.selectedImage = file;
  }

  submit(): void {
    this.error = '';
    this.success = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const payload = this.form.value as CreateSupportEmployeeRequest;

  
    delete (payload as any).imageUrl;

    this.tickets.createSupportEmployee(payload).subscribe({
      next: (res) => {

       
        if (res?.errorCode === 0 && res.data && res.data > 0) {
          const newUserId = res.data;

          if (!this.selectedImage) {
            this.success = 'Support employee created successfully.';
            this.resetForm();
            this.loading = false;
            return;
          }

        
          this.tickets.uploadUserImage(newUserId, this.selectedImage).subscribe({
            next: (imgRes) => {
              if (imgRes?.errorCode === 0) {
                this.success = 'Support employee created successfully with image.';
                this.resetForm();
              } else {
               
                this.success = 'Employee created, but image upload failed.';
                this.error = imgRes?.msgError || '';
              }

              this.loading = false;
            },
            error: (err) => {
              this.success = 'Employee created, but image upload failed.';
              this.error = err?.error?.msgError || 'Image upload server error.';
              this.loading = false;
            }
          });

          return;
        }

        this.error = res?.msgError || 'Failed to create support employee.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.msgError || 'Server error.';
        this.loading = false;
      }
    });
  }

  private resetForm(): void {
    this.form.reset({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      dateOfBirth: '',
      userName: '',
      password: '',

      employeeCode: '',
      hireDate: '',
      salary: 0,
      jobTitle: 1
    });

    this.selectedImage = null;
  }

  back(): void {
    this.router.navigate(['/admin/users-counts']);
  }
}
