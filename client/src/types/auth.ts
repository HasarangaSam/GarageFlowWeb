export type UserRole = "OWNER" | "MANAGER" | "MECHANIC";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
