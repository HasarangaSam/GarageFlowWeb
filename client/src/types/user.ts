export type UserRole = "OWNER" | "MANAGER" | "MECHANIC";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  email: string;
  role: "MECHANIC";
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: StaffUser[];
  };
}

export interface MechanicsResponse {
  success: boolean;
  data: {
    mechanics: Mechanic[];
  };
}

export interface StaffAccountInput {
  name: string;
  email: string;
  password?: string;
  role: Exclude<UserRole, "OWNER">;
}
