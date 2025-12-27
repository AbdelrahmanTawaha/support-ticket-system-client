
export interface CreateSupportEmployeeRequest {
  // Users
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;  // ISO date


  userName?: string;
  password: string;

  // EmployeeProfile
  employeeCode?: string;
  hireDate?: string;
  salary?: number;

  // matches your enum:
  // 0 = SupportManager, 1 = EmployeeSupport
  jobTitle?: number;
}
