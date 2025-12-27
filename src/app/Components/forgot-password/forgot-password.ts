import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/AuthService';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,TranslateModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {

  userNameOrEmail = '';
  loading = false;
  success = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.success = '';
    this.error = '';

    const v = this.userNameOrEmail.trim();
    if (!v) {
      this.error = 'Please enter username or email.';
      return;
    }

    this.loading = true;

    this.auth.forgotPassword(v).subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.errorCode !== 0 && res?.errorCode !== undefined) {
         
          this.success = 'If the account exists, a reset code has been sent.';
          return;
        }

        this.success = 'If the account exists, a reset code has been sent.';

     
        this.router.navigate(['/reset-password'], {
          queryParams: { u: v }
        });
      },
      error: () => {
        this.loading = false;
        this.success = 'If the account exists, a reset code has been sent.';
      }
    });
  }
}
