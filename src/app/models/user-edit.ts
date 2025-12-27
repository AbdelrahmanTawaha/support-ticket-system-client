export interface UserEdit {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string | null;
  dateOfBirth?: string | null; // ISO string
  imageUrl?: string | null;

  userType: number;
  isActive: boolean;
}
