import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../services/AuthService';
import { LoginRequest } from '../../models/auth';


declare global {
  interface Window {
    initLoginBear?: () => (() => void);
    shakeLoginBear?: () => void;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, TranslateModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit, OnDestroy {

  model = {
    email: '',
    password: '',
   
  };

  loading = false;
  errorMessage = '';

  private cleanupBear: (() => void) | null = null;
  private qpSub?: Subscription;

  constructor(
    private router: Router,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit(): void {
   
    this.qpSub = this.route.queryParamMap.subscribe(() => {
      setTimeout(() => {
        this.cleanupBear?.();
        this.cleanupBear = null;

        if (window.initLoginBear) {
          this.cleanupBear = window.initLoginBear();
        } 

        this.resetFormState();
      }, 0);
    });
  }

  ngOnDestroy(): void {
    try {
      this.cleanupBear?.();
      this.cleanupBear = null;

      this.qpSub?.unsubscribe();
      this.qpSub = undefined;
    } catch {
    
    }
  }

  private resetFormState() {
    this.model.email = '';
    this.model.password = '';
   
    this.errorMessage = '';
    this.loading = false;
  }

  private shakeBear() {
    try {
      window.shakeLoginBear?.();
    } catch {}
  }

  goForgot() {
    this.router.navigate(['/forgot-password']);
  }

  onSubmit(form: NgForm) {
    this.errorMessage = '';

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const payload: LoginRequest = {
      userNameOrEmail: this.model.email,
      password: this.model.password,
     
    };

    this.loading = true;

    this.auth.login(payload).subscribe({
      next: res => {
        this.loading = false;

        if (res.errorCode === 0 && res.data) {
          const role = res.data.role;

          if (role === 'SupportManager') {
            this.router.navigate(['/tickets']);
          } else if (role === 'SupportEmployee') {
            this.router.navigate(['/employee']);
          } else {
            this.router.navigate(['/client']);
          }
        } else {
          this.errorMessage = res.msgError || 'Login failed';
          this.shakeBear();
        }
      },
      error: err => {
        this.loading = false;
        this.errorMessage = 'Login error';
        console.error(err);
        this.shakeBear();
      }
    });
  }
}
