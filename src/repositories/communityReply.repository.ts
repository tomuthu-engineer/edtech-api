import { CommunityReply, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

const authorSelect = { id: true, firstName: true, lastName: true, avatarKey: true } satisfies Prisma.UserSelect;

const replyInclude = { author: { select: authorSelect } } satisfies Prisma.CommunityReplyInclude;

export type CommunityReplyWithAuthor = Prisma.CommunityReplyGetPayload<{ include: typeof replyInclude }>;

class CommunityReplyRepository {
  async findByComment(commentId: string, query: PaginationQuery) {
    const { skip, take, page, limit } = toSkipTake(query);
    const where: Prisma.CommunityReplyWhereInput = { commentId, isDeleted: false };

    const [items, total] = await Promise.all([
      prisma.communityReply.findMany({ where, include: replyInclude, orderBy: { createdAt: 'asc' }, skip, take }),
      prisma.communityReply.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findById(id: string): Promise<CommunityReply | null> {
    return prisma.communityReply.findUnique({ where: { id } });
  }

  create(data: Prisma.CommunityReplyCreateInput): Promise<CommunityReplyWithAuthor> {
    return prisma.communityReply.create({ data, include: replyInclude });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.communityReply.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  incrementLikeCount(id: string, delta: 1 | -1): Promise<CommunityReply> {
    return prisma.communityReply.update({ where: { id }, data: { likeCount: { increment: delta } } });
  }
}

export const communityReplyRepository = new CommunityReplyRepository();
