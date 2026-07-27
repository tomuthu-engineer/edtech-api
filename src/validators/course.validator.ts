import { z } from 'zod';
import { CourseDifficulty, CourseStatus } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const listCoursesValidator: RequestSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    categoryId: z.string().uuid().optional(),
    instructorId: z.string().uuid().optional(),
    status: z.nativeEnum(CourseStatus).optional(),
    difficulty: z.nativeEnum(CourseDifficulty).optional(),
    sortBy: z.enum(['newest', 'popular', 'rating', 'price_asc', 'price_desc']).optional(),
  }),
};

export const courseIdParamValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
};

export const courseSlugParamValidator: RequestSchemas = {
  params: z.object({ slug: z.string().min(1) }),
};

const courseBodyBase = {
  title: z.string().trim().min(3).max(200),
  subtitle: z.string().trim().max(300).optional(),
  description: z.string().trim().min(10),
  categoryId: z.string().uuid().optional(),
  difficulty: z.nativeEnum(CourseDifficulty).optional(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  language: z.string().min(2).max(10).optional(),
};

export const createCourseValidator: RequestSchemas = {
  body: z.object(courseBodyBase),
};

export const updateCourseValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object(courseBodyBase).partial(),
};

export const changeCourseStatusValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.nativeEnum(CourseStatus) }),
};
