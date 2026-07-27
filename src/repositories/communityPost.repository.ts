import { CommunityPost, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toCursorArgs, CursorPaginationQuery } from '@utils/pagination';

const authorSelect = { id: true, firstName: true, lastName: true, avatarKey: true } satisfies Prisma.UserSelect;

const postInclude = {
  author: { select: authorSelect },
  pinnedBy: { select: authorSelect },
} satisfies Prisma.CommunityPostInclude;

export type CommunityPostWithAuthor = Prisma.CommunityPostGetPayload<{ include: typeof postInclude }>;

export interface PostFeedFilters extends CursorPaginationQuery {
  authorId?: string;
  search?: string;
}

class CommunityPostRepository {
  async findFeed(filters: PostFeedFilters) {
    const args = toCursorArgs(filters);
    const where: Prisma.CommunityPostWhereInput = {
      isDeleted: false,
      ...(filters.authorId ? { authorId: filters.authorId } : {}),
      ...(filters.search ? { content: { contains: filters.search, mode: 'insensitive' } } : {}),
    };

    return prisma.communityPost.findMany({
      where,
      include: postInclude,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      ...args,
    });
  }

  findById(id: string): Promise<CommunityPostWithAuthor | null> {
    return prisma.communityPost.findUnique({ where: { id }, include: postInclude });
  }

  create(data: Prisma.CommunityPostCreateInput): Promise<CommunityPostWithAuthor> {
    return prisma.communityPost.create({ data, include: postInclude });
  }

  update(id: string, data: Prisma.CommunityPostUpdateInput): Promise<CommunityPost> {
    return prisma.communityPost.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.communityPost.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async setPinned(id: string, isPinned: boolean, pinnedById: string | null): Promise<CommunityPost> {
    return prisma.communityPost.update({
      where: { id },
      data: { isPinned, pinnedById, pinnedAt: isPinned ? new Date() : null },
    });
  }

  incrementLikeCount(id: string, delta: 1 | -1): Promise<CommunityPost> {
    return prisma.communityPost.update({ where: { id }, data: { likeCount: { increment: delta } } });
  }

  incrementCommentCount(id: string, delta: 1 | -1): Promise<CommunityPost> {
    return prisma.communityPost.update({ where: { id }, data: { commentCount: { increment: delta } } });
  }
}

export const communityPostRepository = new CommunityPostRepository();
