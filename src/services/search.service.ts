import { CourseStatus } from '@prisma/client';
import { courseRepository } from '@repositories/course.repository';
import { userRepository } from '@repositories/user.repository';
import { communityPostRepository } from '@repositories/communityPost.repository';
import { liveSessionRepository } from '@repositories/liveSession.repository';
import { toSanitizedUser } from '@utils/mappers/user.mapper';
import { PaginationQuery } from '@utils/pagination';

class SearchService {
  async searchCourses(query: string, pagination: PaginationQuery) {
    return courseRepository.findMany({ ...pagination, search: query, status: CourseStatus.PUBLISHED });
  }

  async searchStudents(query: string, pagination: PaginationQuery) {
    const { items, total, page, limit } = await userRepository.findMany({ ...pagination, search: query });
    return { items: items.map(toSanitizedUser), total, page, limit };
  }

  async searchCommunity(query: string, limit: number) {
    const posts = await communityPostRepository.findFeed({ search: query, limit });
    return posts;
  }

  async searchLiveClasses(query: string, pagination: PaginationQuery) {
    return liveSessionRepository.findMany({ ...pagination, search: query });
  }
}

export const searchService = new SearchService();
