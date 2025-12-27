import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import {  TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink,TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent  {

  constructor(private auth: AuthService, private router: Router) {}

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get userName(): string {
    return this.auth.getUserName() ?? 'Guest';
  }

  get role(): string | null {
    return this.auth.getRole();
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }

  goDashboard(): void {
    if (this.auth.isManager()) {
      this.router.navigate(['/tickets']);
      return;
    }

    if (this.auth.isEmployee()) {
      this.router.navigate(['/employee']);
      return;
    }

    if (this.auth.isClient()) {
      this.router.navigate(['/client']);
      return;
    }

   
    this.router.navigate(['/login']);
  }
}
