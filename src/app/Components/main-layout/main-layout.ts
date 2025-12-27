// src/app/components/main-layout/main-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/AuthService';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive,TranslateModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayoutComponent {
  year = new Date().getFullYear();

  constructor(private auth: AuthService, private router: Router) {}

  get userName(): string | null {
    return localStorage.getItem('auth_username');
  }

  get role(): string | null {
    return this.auth.getRole();
  }

  isManager(): boolean {
    return this.auth.isManager();
  }

  isEmployee(): boolean {
    return this.auth.isEmployee();
  }

  isClient(): boolean {
    return this.auth.isClient();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
