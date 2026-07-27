import { Router } from 'express';
import { storageRouter } from '@routes/v1/storage.routes';
import { authRouter } from '@routes/v1/auth.routes';
import { usersRouter } from '@routes/v1/users.routes';
import { categoriesRouter } from '@routes/v1/categories.routes';
import { coursesRouter } from '@routes/v1/courses.routes';
import { modulesRouter, lessonsRouter, resourcesRouter } from '@routes/v1/curriculum.routes';
import { enrollmentsRouter } from '@routes/v1/enrollments.routes';
import { progressRouter } from '@routes/v1/progress.routes';
import { liveRouter } from '@routes/v1/live.routes';
import { communityRouter } from '@routes/v1/community.routes';
import { notificationsRouter } from '@routes/v1/notifications.routes';
import { searchRouter } from '@routes/v1/search.routes';
import { adminRouter } from '@routes/v1/admin.routes';

/**
 * Root v1 API router. Each domain module registers its own router here.
 * Keeps route wiring declarative and makes it obvious what surface exists
 * at a glance — useful when this eventually splits into microservices.
 */
export const v1Router = Router();

v1Router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'EdTech LMS API v1',
    data: { status: 'ok' },
  });
});

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/categories', categoriesRouter);
v1Router.use('/courses', coursesRouter);
v1Router.use('/modules', modulesRouter);
v1Router.use('/lessons', lessonsRouter);
v1Router.use('/resources', resourcesRouter);
v1Router.use('/enrollments', enrollmentsRouter);
v1Router.use('/progress', progressRouter);
v1Router.use('/live', liveRouter);
v1Router.use('/community', communityRouter);
v1Router.use('/notifications', notificationsRouter);
v1Router.use('/search', searchRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/storage', storageRouter);
