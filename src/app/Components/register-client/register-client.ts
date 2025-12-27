import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../services/AuthService';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirmPassword')?.value;
  if (!p || !c) return null;
  return p === c ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './register-client.html',
  styleUrl: './register-client.css',
})
export class RegisterClientComponent {
  form!: FormGroup;
  loading = false;
  error = '';
  success = '';

  selectedImage: File | null = null;
  imagePreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.buildForm();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      address: [''],
      dateOfBirth: [''],

      // ✅ REQUIRED NOW
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],

      companyName: ['', Validators.required],
      companyAddress: [''],
      vatNumber: [''],
      preferredLanguage: ['en'],
    }, { validators: passwordsMatch });
  }

  // convenient getters
  c(name: string) { return this.form.get(name); }

  onImageSelected(ev: Event): void {
    this.error = '';
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedImage = null;
      this.imagePreviewUrl = null;
      return;
    }

   
    const maxBytes = 3 * 1024 * 1024;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowed.includes(file.type)) {
      this.error = 'Only JPG/PNG/WEBP are allowed.';
      input.value = '';
      return;
    }
    if (file.size > maxBytes) {
      this.error = 'Image too large. Max 3MB.';
      input.value = '';
      return;
    }

    this.selectedImage = file;

   
    const reader = new FileReader();
    reader.onload = () => this.imagePreviewUrl = String(reader.result);
    reader.readAsDataURL(file);
  }

  submit(): void {
    this.error = '';
    this.success = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.errors?.['passwordMismatch']) {
      this.error = 'Passwords do not match.';
      return;
    }

   
    const fd = new FormData();

    fd.append('fullName', this.c('fullName')?.value?.trim() ?? '');
    fd.append('email', this.c('email')?.value?.trim() ?? '');
    fd.append('phoneNumber', this.c('phoneNumber')?.value ?? '');
    fd.append('address', this.c('address')?.value ?? '');

    const dob = this.c('dateOfBirth')?.value;
    if (dob) fd.append('dateOfBirth', dob);

    fd.append('userName', this.c('userName')?.value?.trim() ?? '');
    fd.append('password', this.c('password')?.value ?? '');

    fd.append('companyName', this.c('companyName')?.value?.trim() ?? '');
    fd.append('companyAddress', this.c('companyAddress')?.value ?? '');
    fd.append('vatNumber', this.c('vatNumber')?.value ?? '');
    fd.append('preferredLanguage', this.c('preferredLanguage')?.value ?? 'en');

    if (this.selectedImage) {
      fd.append('profileImage', this.selectedImage);
    }

    this.loading = true;

    this.auth.registerClient(fd).subscribe({
      next: (res) => {
        this.loading = false;

        
        const ok = (res?.errorCode === 0 || res?.errorCode === 'Success');
        if (!ok || !res?.data) {
          this.error = res?.msgError || 'Registration failed.';
          return;
        }

        this.success = 'Account created successfully. You can now log in.';
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.msgError || 'Server error while registering client.';
      },
    });
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }
}
