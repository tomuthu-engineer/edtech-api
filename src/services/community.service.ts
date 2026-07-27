import { NotificationType, PostMediaType } from '@prisma/client';
import { communityPostRepository } from '@repositories/communityPost.repository';
import { communityCommentRepository } from '@repositories/communityComment.repository';
import { communityReplyRepository } from '@repositories/communityReply.repository';
import { communityLikeRepository, LikeTarget } from '@repositories/communityLike.repository';
import { bookmarkRepository } from '@repositories/bookmark.repository';
import { notificationService } from '@services/notification.service';
import { auditLogService } from '@services/auditLog.service';
import { NotFoundError, AuthorizationError } from '@utils/errors';
import { Role, MODERATION_ROLES } from '@constants/roles.constant';
import { CursorPaginationQuery, PaginationQuery, buildCursorMeta } from '@utils/pagination';
import { emitToCommunity } from '@socket/ioInstance';
import { SocketEvent } from '@socket/socketEvents.constant';

interface ActorContext {
  actorId: string;
  roles: Role[];
}

function isModerator(roles: Role[]): boolean {
  return roles.some((role) => MODERATION_ROLES.includes(role));
}

class CommunityService {
  // ---- Posts ---------------------------------------------------------------

  async listFeed(query: CursorPaginationQuery & { authorId?: string }) {
    const limit = query.limit ?? 20;
    const posts = await communityPostRepository.findFeed(query);
    return buildCursorMeta(posts, limit);
  }

  async getPost(id: string) {
    const post = await communityPostRepository.findById(id);
    if (!post || post.isDeleted) throw new NotFoundError('Post');
    return post;
  }

  async createPost(actor: ActorContext, content: string, mediaKeys: string[] = []) {
    const mediaType =
      mediaKeys.length === 0 ? PostMediaType.NONE : mediaKeys.length > 1 ? PostMediaType.MIXED : PostMediaType.IMAGE;

    const post = await communityPostRepository.create({
      content,
      mediaKeys,
      mediaType,
      author: { connect: { id: actor.actorId } },
    });

    emitToCommunity(SocketEvent.COMMUNITY_POST_CREATED, post);
    return post;
  }

  async deletePost(id: string, actor: ActorContext) {
    const post = await this.getPost(id);
    this.assertOwnerOrModerator(post.authorId, actor);

    await communityPostRepository.softDelete(id);
    emitToCommunity(SocketEvent.COMMUNITY_POST_DELETED, { id });

    if (post.authorId !== actor.actorId) {
      await auditLogService.record({ actorId: actor.actorId, action: 'MODERATE', entityType: 'CommunityPost', entityId: id });
    }
  }

  async pinPost(id: string, actor: ActorContext, isPinned: boolean) {
    if (!isModerator(actor.roles)) throw new AuthorizationError('Only moderators can pin posts');
    await this.getPost(id);
    const post = await communityPostRepository.setPinned(id, isPinned, isPinned ? actor.actorId : null);
    await auditLogService.record({ actorId: actor.actorId, action: 'MODERATE', entityType: 'CommunityPost', entityId: id, metadata: { isPinned } });
    return post;
  }

  async toggleBookmark(userId: string, postId: string) {
    await this.getPost(postId);
    const existing = await bookmarkRepository.findExisting(userId, postId);
    if (existing) {
      await bookmarkRepository.delete(existing.id);
      return { bookmarked: false };
    }
    await bookmarkRepository.create(userId, postId);
    return { bookmarked: true };
  }

  listBookmarks(userId: string, query: PaginationQuery) {
    return bookmarkRepository.findForUser(userId, query);
  }

  // ---- Comments --------------------------------------------------------------

  listComments(postId: string, query: PaginationQuery) {
    return communityCommentRepository.findByPost(postId, query);
  }

  async createComment(actor: ActorContext, postId: string, content: string) {
    const post = await this.getPost(postId);

    const comment = await communityCommentRepository.create({
      content,
      post: { connect: { id: postId } },
      author: { connect: { id: actor.actorId } },
    });

    await communityPostRepository.incrementCommentCount(postId, 1);
    emitToCommunity(SocketEvent.COMMUNITY_COMMENT_CREATED, comment);

    if (post.authorId !== actor.actorId) {
      await notificationService.dispatch({
        userIds: [post.authorId],
        type: NotificationType.COMMUNITY,
        title: 'New comment on your post',
        body: content.slice(0, 140),
        actionUrl: `/community/posts/${postId}`,
      });
    }

    return comment;
  }

  async deleteComment(id: string, actor: ActorContext) {
    const comment = await communityCommentRepository.findById(id);
    if (!comment || comment.isDeleted) throw new NotFoundError('Comment');
    this.assertOwnerOrModerator(comment.authorId, actor);

    await communityCommentRepository.softDelete(id);
    await communityPostRepository.incrementCommentCount(comment.postId, -1);
  }

  // ---- Replies -----------------------------------------------------------

  listReplies(commentId: string, query: PaginationQuery) {
    return communityReplyRepository.findByComment(commentId, query);
  }

  async createReply(actor: ActorContext, commentId: string, content: string) {
    const comment = await communityCommentRepository.findById(commentId);
    if (!comment || comment.isDeleted) throw new NotFoundError('Comment');

    const reply = await communityReplyRepository.create({
      content,
      comment: { connect: { id: commentId } },
      author: { connect: { id: actor.actorId } },
    });

    await communityCommentRepository.incrementReplyCount(commentId, 1);
    emitToCommunity(SocketEvent.COMMUNITY_REPLY_CREATED, reply);

    if (comment.authorId !== actor.actorId) {
      await notificationService.dispatch({
        userIds: [comment.authorId],
        type: NotificationType.COMMUNITY,
        title: 'New reply to your comment',
        body: content.slice(0, 140),
        actionUrl: `/community/posts/${comment.postId}`,
      });
    }

    return reply;
  }

  async deleteReply(id: string, actor: ActorContext) {
    const reply = await communityReplyRepository.findById(id);
    if (!reply || reply.isDeleted) throw new NotFoundError('Reply');
    this.assertOwnerOrModerator(reply.authorId, actor);

    await communityReplyRepository.softDelete(id);
    await communityCommentRepository.incrementReplyCount(reply.commentId, -1);
  }

  // ---- Likes ---------------------------------------------------------------

  async toggleLike(userId: string, target: LikeTarget) {
    const existing = await communityLikeRepository.findExisting(userId, target);

    if (existing) {
      await communityLikeRepository.delete(existing.id);
      await this.adjustLikeCount(target, -1);
      return { liked: false };
    }

    await communityLikeRepository.create(userId, target);
    await this.adjustLikeCount(target, 1);
    emitToCommunity(SocketEvent.COMMUNITY_POST_LIKED, { userId, ...target });
    return { liked: true };
  }

  private async adjustLikeCount(target: LikeTarget, delta: 1 | -1): Promise<void> {
    if ('postId' in target) {
      await communityPostRepository.incrementLikeCount(target.postId, delta);
    } else if ('commentId' in target) {
      await communityCommentRepository.incrementLikeCount(target.commentId, delta);
    } else {
      await communityReplyRepository.incrementLikeCount(target.replyId, delta);
    }
  }

  // ---- Shared helpers --------------------------------------------------------

  private assertOwnerOrModerator(ownerId: string, actor: ActorContext): void {
    if (ownerId !== actor.actorId && !isModerator(actor.roles)) {
      throw new AuthorizationError('You do not have permission to modify this content');
    }
  }
}

export const communityService = new CommunityService();
