import { z } from 'zod';
import { AccountStatus } from '@prisma/client';
import { Role } from '@constants/roles.constant';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const listUsersValidator: RequestSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(AccountStatus).optional(),
  }),
};

export const userIdParamValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
};

export const updateProfileValidator: RequestSchemas = {
  body: z.object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    bio: z.string().max(1000).optional(),
    phone: z.string().max(20).optional(),
  }),
};

export const updateUserStatusValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.nativeEnum(AccountStatus) }),
};

export const updateUserRolesValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    role: z.nativeEnum(Role),
    action: z.enum(['ASSIGN', 'REMOVE']),
  }),
};
