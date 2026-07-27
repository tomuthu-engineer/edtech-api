import { Bookmark, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

class BookmarkRepository {
  findExisting(userId: string, postId: string): Promise<Bookmark | null> {
    return prisma.bookmark.findUnique({ where: { userId_postId: { userId, postId } } });
  }

  create(userId: string, postId: string): Promise<Bookmark> {
    return prisma.bookmark.create({ data: { userId, postId } });
  }

  async delete(id: string): Promise<void> {
    await prisma.bookmark.delete({ where: { id } });
  }

  async findForUser(userId: string, query: PaginationQuery) {
    const { skip, take, page, limit } = toSkipTake(query);
    const where: Prisma.BookmarkWhereInput = { userId };

    const [items, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        include: {
          post: { include: { author: { select: { id: true, firstName: true, lastName: true, avatarKey: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.bookmark.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}

export const bookmarkRepository = new BookmarkRepository();
