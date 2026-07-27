import { Router } from 'express';
import { communityController } from '@controllers/community.controller';
import { reportController } from '@controllers/report.controller';
import { authenticate } from '@middlewares/authenticate.middleware';
import { requireRole } from '@middlewares/authorize.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { MODERATION_ROLES } from '@constants/roles.constant';
import {
  listFeedValidator,
  postIdParamValidator,
  createPostValidator,
  pinPostValidator,
  paginationValidator,
  listCommentsValidator,
  createCommentValidator,
  commentIdParamValidator,
  listRepliesValidator,
  createReplyValidator,
  replyIdParamValidator,
} from '@validators/community.validator';
import { createReportValidator, listReportsValidator, resolveReportValidator } from '@validators/report.validator';

export const communityRouter = Router();

communityRouter.use(authenticate);

/**
 * @openapi
 * /community/posts:
 *   get:
 *     tags: [Community]
 *     summary: Cursor-paginated community feed (pinned posts first)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Community]
 *     summary: Create a community post
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreatePostBody' }
 *     responses: { 201: { description: Created } }
 */
communityRouter.get('/posts', validateRequest(listFeedValidator), communityController.listFeed);
communityRouter.post('/posts', validateRequest(createPostValidator), communityController.createPost);

/**
 * @openapi
 * /community/posts/{postId}:
 *   get:
 *     tags: [Community]
 *     summary: Get a single post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PostIdParam'
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Community]
 *     summary: Delete a post (author or moderator)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PostIdParam'
 *     responses: { 200: { description: Deleted } }
 */
communityRouter.get('/posts/:postId', validateRequest(postIdParamValidator), communityController.getPost);
communityRouter.delete('/posts/:postId', validateRequest(postIdParamValidator), communityController.deletePost);

/**
 * @openapi
 * /community/posts/{postId}/pin:
 *   patch:
 *     tags: [Community]
 *     summary: Pin/unpin a post to the top of the feed (moderator only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PostIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PinPostBody' }
 *     responses: { 200: { description: Pin status updated } }
 */
communityRouter.patch(
  '/posts/:postId/pin',
  requireRole(...MODERATION_ROLES),
  validateRequest(pinPostValidator),
  communityController.pinPost,
);

/**
 * @openapi
 * /community/posts/{postId}/like:
 *   post:
 *     tags: [Community]
 *     summary: Toggle a like on a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PostIdParam'
 *     responses: { 200: { description: Like toggled } }
 */
communityRouter.post('/posts/:postId/like', validateRequest(postIdParamValidator), communityController.likePost);

/**
 * @openapi
 * /community/posts/{postId}/bookmark:
 *   post:
 *     tags: [Community]
 *     summary: Toggle a bookmark on a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PostIdParam'
 *     responses: { 200: { description: Bookmark toggled } }
 */
communityRouter.post('/posts/:postId/bookmark', validateRequest(postIdParamValidator), communityController.toggleBookmark);
communityRouter.get('/bookmarks', validateRequest(paginationValidator), communityController.listBookmarks);

/**
 * @openapi
 * /community/posts/{postId}/comments:
 *   get:
 *     tags: [Community]
 *     summary: List a post's comments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PostIdParam'
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Community]
 *     summary: Comment on a post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PostIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCommentBody' }
 *     responses: { 201: { description: Created } }
 */
communityRouter.get('/posts/:postId/comments', validateRequest(listCommentsValidator), communityController.listComments);
communityRouter.post('/posts/:postId/comments', validateRequest(createCommentValidator), communityController.createComment);

/**
 * @openapi
 * /community/comments/{commentId}:
 *   delete:
 *     tags: [Community]
 *     summary: Delete a comment (author or moderator)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CommentIdParam'
 *     responses: { 200: { description: Deleted } }
 */
communityRouter.delete('/comments/:commentId', validateRequest(commentIdParamValidator), communityController.deleteComment);

/**
 * @openapi
 * /community/comments/{commentId}/like:
 *   post:
 *     tags: [Community]
 *     summary: Toggle a like on a comment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CommentIdParam'
 *     responses: { 200: { description: Like toggled } }
 */
communityRouter.post('/comments/:commentId/like', validateRequest(commentIdParamValidator), communityController.likeComment);

/**
 * @openapi
 * /community/comments/{commentId}/replies:
 *   get:
 *     tags: [Community]
 *     summary: List a comment's replies
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CommentIdParam'
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Community]
 *     summary: Reply to a comment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/CommentIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateReplyBody' }
 *     responses: { 201: { description: Created } }
 */
communityRouter.get('/comments/:commentId/replies', validateRequest(listRepliesValidator), communityController.listReplies);
communityRouter.post('/comments/:commentId/replies', validateRequest(createReplyValidator), communityController.createReply);

/**
 * @openapi
 * /community/replies/{replyId}:
 *   delete:
 *     tags: [Community]
 *     summary: Delete a reply (author or moderator)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ReplyIdParam'
 *     responses: { 200: { description: Deleted } }
 */
communityRouter.delete('/replies/:replyId', validateRequest(replyIdParamValidator), communityController.deleteReply);

/**
 * @openapi
 * /community/replies/{replyId}/like:
 *   post:
 *     tags: [Community]
 *     summary: Toggle a like on a reply
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ReplyIdParam'
 *     responses: { 200: { description: Like toggled } }
 */
communityRouter.post('/replies/:replyId/like', validateRequest(replyIdParamValidator), communityController.likeReply);

// ---- Moderation: reports ----------------------------------------------------

/**
 * @openapi
 * /community/reports:
 *   post:
 *     tags: [Community]
 *     summary: Report a post/comment/reply/user for moderation review
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateReportBody' }
 *     responses: { 201: { description: Report filed } }
 *   get:
 *     tags: [Community]
 *     summary: List moderation reports (moderator only)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
communityRouter.post('/reports', validateRequest(createReportValidator), reportController.create);
communityRouter.get(
  '/reports',
  requireRole(...MODERATION_ROLES),
  validateRequest(listReportsValidator),
  reportController.list,
);

/**
 * @openapi
 * /community/reports/{id}:
 *   patch:
 *     tags: [Community]
 *     summary: Resolve a moderation report (moderator only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResolveReportBody' }
 *     responses: { 200: { description: Resolved } }
 */
communityRouter.patch(
  '/reports/:id',
  requireRole(...MODERATION_ROLES),
  validateRequest(resolveReportValidator),
  reportController.resolve,
);
