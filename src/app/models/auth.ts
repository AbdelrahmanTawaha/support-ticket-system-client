export interface LoginRequest {
  userNameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  fullName: string;
  userName: string;
  role: string;
}
