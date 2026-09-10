export type UserRole = 'admin' | 'branch_manager' | 'cashier' | 'kitchen' | 'staff';

export interface AuthSession {
  userId: string;
  email?: string;
  name: string;
  role: UserRole;
  branchId?: string;
  restaurantId?: string;
  exp: number; // Unix timestamp in seconds
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email?: string;
    name: string;
    role: UserRole;
    branchId?: string;
  };
  redirectTo?: string;
  error?: string;
}
