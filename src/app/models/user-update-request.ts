export interface UpdateUserRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string | null;
  dateOfBirth?: string | null;
 
}
