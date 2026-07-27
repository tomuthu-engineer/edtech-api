import { Role } from '@constants/roles.constant';

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceId?: string;
  deviceName?: string;
}

export interface DeviceContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface SanitizedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  roles: Role[];
  status: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface AuthResult {
  user: SanitizedUser;
  tokens: AuthTokens;
}
