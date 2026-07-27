import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { communityService } from '@services/community.service';

function actorContext(req: Request) {
  return { actorId: req.user!.id, roles: req.user!.roles };
}

export const communityController = {
  listFeed: asyncHandler(async (req: Request, res: Response) => {
    const { items, hasNextPage, nextCursor } = await communityService.listFeed(req.query as never);
    ApiResponse.success(res, {
      message: 'Feed retrieved',
      data: items,
      meta: { hasNextPage, nextCursor },
    });
  }),

  getPost: asyncHandler(async (req: Request, res: Response) => {
    const post = await communityService.getPost(req.params.postId);
    ApiResponse.success(res, { message: 'Post retrieved', data: post });
  }),

  createPost: asyncHandler(async (req: Request, res: Response) => {
    const post = await communityService.createPost(actorContext(req), req.body.content, req.body.mediaKeys);
    ApiResponse.created(res, 'Post created', post);
  }),

  deletePost: asyncHandler(async (req: Request, res: Response) => {
    await communityService.deletePost(req.params.postId, actorContext(req));
    ApiResponse.success(res, { message: 'Post deleted successfully', data: null });
  }),

  pinPost: asyncHandler(async (req: Request, res: Response) => {
    const post = await communityService.pinPost(req.params.postId, actorContext(req), req.body.isPinned);
    ApiResponse.success(res, { message: 'Post pin status updated', data: post });
  }),

  likePost: asyncHandler(async (req: Request, res: Response) => {
    const result = await communityService.toggleLike(req.user!.id, { postId: req.params.postId });
    ApiResponse.success(res, { message: 'Like toggled', data: result });
  }),

  toggleBookmark: asyncHandler(async (req: Request, res: Response) => {
    const result = await communityService.toggleBookmark(req.user!.id, req.params.postId);
    ApiResponse.success(res, { message: 'Bookmark toggled', data: result });
  }),

  listBookmarks: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await communityService.listBookmarks(req.user!.id, req.query as never);
    ApiResponse.success(res, {
      message: 'Bookmarks retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  listComments: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await communityService.listComments(req.params.postId, req.query as never);
    ApiResponse.success(res, {
      message: 'Comments retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  createComment: asyncHandler(async (req: Request, res: Response) => {
    const comment = await communityService.createComment(actorContext(req), req.params.postId, req.body.content);
    ApiResponse.created(res, 'Comment added', comment);
  }),

  deleteComment: asyncHandler(async (req: Request, res: Response) => {
    await communityService.deleteComment(req.params.commentId, actorContext(req));
    ApiResponse.success(res, { message: 'Comment deleted successfully', data: null });
  }),

  likeComment: asyncHandler(async (req: Request, res: Response) => {
    const result = await communityService.toggleLike(req.user!.id, { commentId: req.params.commentId });
    ApiResponse.success(res, { message: 'Like toggled', data: result });
  }),

  listReplies: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await communityService.listReplies(req.params.commentId, req.query as never);
    ApiResponse.success(res, {
      message: 'Replies retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  createReply: asyncHandler(async (req: Request, res: Response) => {
    const reply = await communityService.createReply(actorContext(req), req.params.commentId, req.body.content);
    ApiResponse.created(res, 'Reply added', reply);
  }),

  deleteReply: asyncHandler(async (req: Request, res: Response) => {
    await communityService.deleteReply(req.params.replyId, actorContext(req));
    ApiResponse.success(res, { message: 'Reply deleted successfully', data: null });
  }),

  likeReply: asyncHandler(async (req: Request, res: Response) => {
    const result = await communityService.toggleLike(req.user!.id, { replyId: req.params.replyId });
    ApiResponse.success(res, { message: 'Like toggled', data: result });
  }),
};
