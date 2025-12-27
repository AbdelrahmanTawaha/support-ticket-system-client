import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/AuthService';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,TranslateModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPasswordComponent implements OnInit {

  userNameOrEmail = '';
  code = '';
  newPassword = '';
  confirmPassword = '';

  loading = false;
  success = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const u = this.route.snapshot.queryParamMap.get('u');
    if (u) this.userNameOrEmail = u;
  }

  submit(): void {
    this.success = '';
    this.error = '';

    if (!this.userNameOrEmail.trim() || !this.code.trim() || !this.newPassword.trim()) {
      this.error = 'Please fill all fields.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    this.auth.resetPassword({
      userNameOrEmail: this.userNameOrEmail.trim(),
      code: this.code.trim(),
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.errorCode !== 0 || !res?.data) {
          this.error = res?.msgError || 'Reset failed.';
          return;
        }

        this.success = 'Password changed successfully.';
        setTimeout(() => this.router.navigate(['/login']), 400);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.msgError || 'Server error.';
      }
    });
  }
}
