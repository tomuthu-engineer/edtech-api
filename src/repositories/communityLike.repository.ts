import { CommunityLike } from '@prisma/client';
import { prisma } from '@config/database';

export type LikeTarget = { postId: string } | { commentId: string } | { replyId: string };

function whereForTarget(userId: string, target: LikeTarget) {
  if ('postId' in target) return { userId_postId: { userId, postId: target.postId } };
  if ('commentId' in target) return { userId_commentId: { userId, commentId: target.commentId } };
  return { userId_replyId: { userId, replyId: target.replyId } };
}

class CommunityLikeRepository {
  findExisting(userId: string, target: LikeTarget): Promise<CommunityLike | null> {
    return prisma.communityLike.findUnique({ where: whereForTarget(userId, target) });
  }

  create(userId: string, target: LikeTarget): Promise<CommunityLike> {
    return prisma.communityLike.create({ data: { userId, ...target } });
  }

  async delete(id: string): Promise<void> {
    await prisma.communityLike.delete({ where: { id } });
  }
}

export const communityLikeRepository = new CommunityLikeRepository();
