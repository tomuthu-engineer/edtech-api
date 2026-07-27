import { z } from 'zod';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerValidator: RequestSchemas = {
  body: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: passwordSchema,
  }),
};

export const loginValidator: RequestSchemas = {
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
    rememberMe: z.boolean().optional().default(false),
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
  }),
};

export const refreshTokenValidator: RequestSchemas = {
  body: z.object({
    refreshToken: z.string().min(1).optional(),
  }),
};

export const logoutValidator: RequestSchemas = {
  body: z.object({
    refreshToken: z.string().min(1).optional(),
  }),
};

export const forgotPasswordValidator: RequestSchemas = {
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
  }),
};

export const resetPasswordValidator: RequestSchemas = {
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    otp: z.string().min(4).max(10),
    newPassword: passwordSchema,
  }),
};

export const verifyEmailValidator: RequestSchemas = {
  body: z.object({
    otp: z.string().min(4).max(10),
  }),
};

export const resendOtpValidator: RequestSchemas = {
  body: z.object({
    purpose: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION']),
    email: z.string().trim().toLowerCase().email().optional(),
  }),
};
