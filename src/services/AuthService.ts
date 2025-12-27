import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';

import { environment } from '../environments/environment';
import { ApiResponse } from '../app/models/ApiResponse';
import { LoginRequest, LoginResponse } from '../app/models/auth';


type AuthState = {
  isLoggedIn: boolean;
  role: string | null;
  userName: string | null;
  userId: number | null;

 
  profileImageUrl: string | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';

 
  private readonly PROFILE_IMAGE_KEY = 'profile_image';


  private readonly stateSubject = new BehaviorSubject<AuthState>(this.buildState());
  readonly state$ = this.stateSubject.asObservable();


  readonly isLoggedIn$ = this.state$.pipe(map(s => s.isLoggedIn));
  readonly role$ = this.state$.pipe(map(s => s.role));
  readonly userName$ = this.state$.pipe(map(s => s.userName));
  readonly userId$ = this.state$.pipe(map(s => s.userId));


  readonly profileImageUrl$ = this.state$.pipe(map(s => s.profileImageUrl));

  constructor(private http: HttpClient) {}

  // =========================
  // Login
  // =========================
  login(payload: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${environment.apiUrl}/Auth/login`,
      payload
    ).pipe(
      tap(res => {
        if (res.errorCode === 0 && res.data?.token) {
          this.setToken(res.data.token);
       
        }
      })
    );
  }

 registerClient(form: FormData) {
  return this.http.post<any>(
    `${environment.apiUrl}/Auth/register-client`,
    form
  );
}




  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.emitState();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.emitState();
  }

  // =========================
  // Profile Image Local Storage
  // =========================
  setProfileImageUrl(url: string): void {
    if (!url) return;
    localStorage.setItem(this.PROFILE_IMAGE_KEY, url);
    this.emitState();
  }

  getProfileImageUrl(): string | null {
    return localStorage.getItem(this.PROFILE_IMAGE_KEY);
  }

  clearProfileImageUrl(): void {
    localStorage.removeItem(this.PROFILE_IMAGE_KEY);
    this.emitState();
  }

  // =========================
  // JWT payload helpers
  // =========================
  private decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return atob(padded);
  }

  private getPayload(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const part = token.split('.')[1];
      if (!part) return null;

      const json = this.decodeBase64Url(part);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // =========================
  // Role from token
  // =========================
  getRole(): string | null {
    const p = this.getPayload();
    if (!p) return null;

    return (
      p['role'] ??
      p['roles'] ??
      p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      null
    );
  }

  isManager(): boolean {
    return this.getRole() === 'SupportManager';
  }

  isEmployee(): boolean {
    return this.getRole() === 'SupportEmployee';
  }

  isClient(): boolean {
    return this.getRole() === 'ExternalClient';
  }

  // =========================
  // UserName from token
  // =========================
  getUserName(): string | null {
    const p = this.getPayload();
    if (!p) return null;

    return (
      p['unique_name'] ??
      p['name'] ??
      p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
      null
    );
  }

  // =========================
  // UserId from token
  // =========================
  getUserId(): number | null {
    const p = this.getPayload();
    if (!p) return null;

    const id =
      p['nameid'] ??
      p['sub'] ??
      p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }

  forgotPassword(userNameOrEmail: string) {
    return this.http.post<any>(`${environment.apiUrl}/Auth/forgot-password`, {
      userNameOrEmail
    });
  }

  resetPassword(payload: { userNameOrEmail: string; code: string; newPassword: string; }) {
    return this.http.post<any>(`${environment.apiUrl}/Auth/reset-password`, payload);
  }

  // =========================
  // Logged in
  // =========================
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // =========================
  // Logout
  // =========================
  logout(): void {
   
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.PROFILE_IMAGE_KEY);
    this.emitState();
  }

  // =========================
  // Reactive state helpers
  // =========================
  private buildState(): AuthState {
    const token = this.getToken();
    const img = this.getProfileImageUrl();

    if (!token) {
      return {
        isLoggedIn: false,
        role: null,
        userName: null,
        userId: null,
        profileImageUrl: img
      };
    }

    return {
      isLoggedIn: true,
      role: this.getRole(),
      userName: this.getUserName(),
      userId: this.getUserId(),
      profileImageUrl: img
    };
  }

  private emitState(): void {
    this.stateSubject.next(this.buildState());
  }

  refreshState(): void {
    this.emitState();
  }
}
