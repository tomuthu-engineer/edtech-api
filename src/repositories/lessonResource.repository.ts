import { LessonResource, Prisma } from '@prisma/client';
import { prisma } from '@config/database';

class LessonResourceRepository {
  findByLesson(lessonId: string): Promise<LessonResource[]> {
    return prisma.lessonResource.findMany({ where: { lessonId }, orderBy: { sortOrder: 'asc' } });
  }

  findById(id: string): Promise<LessonResource | null> {
    return prisma.lessonResource.findUnique({ where: { id } });
  }

  create(data: Prisma.LessonResourceCreateInput): Promise<LessonResource> {
    return prisma.lessonResource.create({ data });
  }

  delete(id: string): Promise<LessonResource> {
    return prisma.lessonResource.delete({ where: { id } });
  }
}

export const lessonResourceRepository = new LessonResourceRepository();
