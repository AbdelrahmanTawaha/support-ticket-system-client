export interface RegisterClientRequest {
  // Users
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string; // ISO string
  userName?: string;
  password: string;

  // ClientProfiles
  companyName: string;
  companyAddress?: string;
  vatNumber?: string;
  preferredLanguage?: string;
}