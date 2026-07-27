import { CommunityComment, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

const authorSelect = { id: true, firstName: true, lastName: true, avatarKey: true } satisfies Prisma.UserSelect;

const commentInclude = { author: { select: authorSelect } } satisfies Prisma.CommunityCommentInclude;

export type CommunityCommentWithAuthor = Prisma.CommunityCommentGetPayload<{ include: typeof commentInclude }>;

class CommunityCommentRepository {
  async findByPost(postId: string, query: PaginationQuery) {
    const { skip, take, page, limit } = toSkipTake(query);
    const where: Prisma.CommunityCommentWhereInput = { postId, isDeleted: false };

    const [items, total] = await Promise.all([
      prisma.communityComment.findMany({ where, include: commentInclude, orderBy: { createdAt: 'asc' }, skip, take }),
      prisma.communityComment.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findById(id: string): Promise<CommunityComment | null> {
    return prisma.communityComment.findUnique({ where: { id } });
  }

  create(data: Prisma.CommunityCommentCreateInput): Promise<CommunityCommentWithAuthor> {
    return prisma.communityComment.create({ data, include: commentInclude });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.communityComment.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  incrementLikeCount(id: string, delta: 1 | -1): Promise<CommunityComment> {
    return prisma.communityComment.update({ where: { id }, data: { likeCount: { increment: delta } } });
  }

  incrementReplyCount(id: string, delta: 1 | -1): Promise<CommunityComment> {
    return prisma.communityComment.update({ where: { id }, data: { replyCount: { increment: delta } } });
  }
}

export const communityCommentRepository = new CommunityCommentRepository();
