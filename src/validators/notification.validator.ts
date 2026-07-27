import { z } from 'zod';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const listNotificationsValidator: RequestSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    unreadOnly: z.coerce.boolean().optional(),
  }),
};

export const userNotificationIdParamValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
};
