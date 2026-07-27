import { z } from 'zod';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const searchValidator: RequestSchemas = {
  query: z.object({
    q: z.string().trim().min(1).max(200),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
};
