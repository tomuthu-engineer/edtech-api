import { Role } from '@constants/roles.constant';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export {};
