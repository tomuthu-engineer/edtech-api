import { z } from 'zod';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const listFeedValidator: RequestSchemas = {
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    authorId: z.string().uuid().optional(),
  }),
};

export const postIdParamValidator: RequestSchemas = {
  params: z.object({ postId: z.string().uuid() }),
};

export const commentIdParamValidator: RequestSchemas = {
  params: z.object({ commentId: z.string().uuid() }),
};

export const replyIdParamValidator: RequestSchemas = {
  params: z.object({ replyId: z.string().uuid() }),
};

export const createPostValidator: RequestSchemas = {
  body: z.object({
    content: z.string().trim().min(1).max(3000),
    mediaKeys: z.array(z.string()).max(10).optional(),
  }),
};

export const paginationValidator: RequestSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};

export const listCommentsValidator: RequestSchemas = {
  params: z.object({ postId: z.string().uuid() }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};

export const listRepliesValidator: RequestSchemas = {
  params: z.object({ commentId: z.string().uuid() }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};

export const createCommentValidator: RequestSchemas = {
  params: z.object({ postId: z.string().uuid() }),
  body: z.object({ content: z.string().trim().min(1).max(2000) }),
};

export const createReplyValidator: RequestSchemas = {
  params: z.object({ commentId: z.string().uuid() }),
  body: z.object({ content: z.string().trim().min(1).max(2000) }),
};

export const pinPostValidator: RequestSchemas = {
  params: z.object({ postId: z.string().uuid() }),
  body: z.object({ isPinned: z.boolean() }),
};
