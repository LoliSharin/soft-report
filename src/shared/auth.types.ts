export type UserRole = 'admin' | 'user';

export interface UserRecord {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface UserInput {
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export interface AuthSession {
  user: UserRecord;
}
