/* eslint-disable no-console */
import { PrismaClient, RoleName, CourseStatus, CourseDifficulty, LessonContentType, LiveSessionStatus, LiveSessionProvider, EnrollmentStatus, LessonProgressStatus, NotificationType, PostMediaType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const hash = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  return faker.helpers.arrayElements(arr, Math.min(count, arr.length));
}

async function seedRoles() {
  console.log('Seeding roles...');
  const roles = Object.values(RoleName);
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `${name} role` } });
  }
  return prisma.role.findMany();
}

async function seedUsers() {
  console.log('Seeding users...');
  const passwordHash = await hash('Passw0rd!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@edtech-lms.com' },
    update: {},
    create: {
      firstName: 'Ada',
      lastName: 'Admin',
      email: 'admin@edtech-lms.com',
      passwordHash,
      status: 'ACTIVE',
      isEmailVerified: true,
      roles: { create: [{ role: { connect: { name: RoleName.SUPER_ADMIN } } }] },
    },
  });

  const instructors = [];
  for (let i = 0; i < 3; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const instructor = await prisma.user.upsert({
      where: { email: `instructor${i + 1}@edtech-lms.com` },
      update: {},
      create: {
        firstName,
        lastName,
        email: `instructor${i + 1}@edtech-lms.com`,
        passwordHash,
        status: 'ACTIVE',
        isEmailVerified: true,
        bio: faker.lorem.sentence(),
        roles: { create: [{ role: { connect: { name: RoleName.INSTRUCTOR } } }] },
      },
    });
    instructors.push(instructor);
  }

  const students = [];
  for (let i = 0; i < 5; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const student = await prisma.user.upsert({
      where: { email: `student${i + 1}@edtech-lms.com` },
      update: {},
      create: {
        firstName,
        lastName,
        email: `student${i + 1}@edtech-lms.com`,
        passwordHash,
        status: 'ACTIVE',
        isEmailVerified: true,
        roles: { create: [{ role: { connect: { name: RoleName.STUDENT } } }] },
      },
    });
    students.push(student);
  }

  return { admin, instructors, students };
}

async function seedCategories() {
  console.log('Seeding categories...');
  const names = ['Web Development', 'Data Science', 'Design', 'Business', 'Mobile Development', 'Marketing'];
  const categories = [];
  for (const name of names) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description: faker.lorem.sentence() },
    });
    categories.push(category);
  }
  return categories;
}

async function seedCoursesWithCurriculum(instructors: { id: string }[], categories: { id: string }[]) {
  console.log('Seeding 20 courses with modules/lessons (target 120 lessons)...');
  const courses = [];
  const totalCourses = 20;
  const totalLessonsTarget = 120;
  const baseLessonsPerCourse = Math.floor(totalLessonsTarget / totalCourses);

  for (let i = 0; i < totalCourses; i++) {
    const title = `${faker.company.buzzPhrase()} — Course ${i + 1}`;
    const slug = `${faker.helpers.slugify(title).toLowerCase()}-${i + 1}`;

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        subtitle: faker.lorem.sentence(),
        description: faker.lorem.paragraphs(3),
        difficulty: pick(Object.values(CourseDifficulty)),
        status: CourseStatus.PUBLISHED,
        price: faker.number.int({ min: 0, max: 200 }),
        durationMinutes: faker.number.int({ min: 60, max: 1200 }),
        learningOutcomes: Array.from({ length: 4 }, () => faker.lorem.sentence()),
        requirements: Array.from({ length: 3 }, () => faker.lorem.sentence()),
        publishedAt: new Date(),
        instructor: { connect: { id: pick(instructors).id } },
        category: { connect: { id: pick(categories).id } },
      },
    });

    const moduleCount = faker.number.int({ min: 2, max: 3 });
    let lessonsCreated = 0;
    const lessonsForThisCourse = i === totalCourses - 1
      ? totalLessonsTarget - baseLessonsPerCourse * (totalCourses - 1)
      : baseLessonsPerCourse;

    for (let m = 0; m < moduleCount; m++) {
      const module_ = await prisma.module.create({
        data: {
          title: `Module ${m + 1}: ${faker.lorem.words(3)}`,
          description: faker.lorem.sentence(),
          sortOrder: m,
          course: { connect: { id: course.id } },
        },
      });

      const lessonsInModule =
        m === moduleCount - 1 ? lessonsForThisCourse - lessonsCreated : Math.ceil(lessonsForThisCourse / moduleCount);

      for (let l = 0; l < lessonsInModule; l++) {
        await prisma.lesson.create({
          data: {
            title: faker.lorem.sentence(4),
            description: faker.lorem.sentence(),
            contentType: LessonContentType.VIDEO,
            videoDurationSec: faker.number.int({ min: 180, max: 900 }),
            isPreview: l === 0 && m === 0,
            isLocked: !(l === 0 && m === 0),
            sortOrder: l,
            module: { connect: { id: module_.id } },
          },
        });
        lessonsCreated++;
      }
    }

    courses.push(course);
  }

  return courses;
}

async function seedLiveSessions(instructors: { id: string }[], courses: { id: string }[]) {
  console.log('Seeding 10 live sessions...');
  const sessions = [];
  for (let i = 0; i < 10; i++) {
    const start = faker.date.soon({ days: 30 });
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const session = await prisma.liveSession.create({
      data: {
        title: `Live: ${faker.lorem.words(3)}`,
        description: faker.lorem.sentence(),
        provider: LiveSessionProvider.LIVEKIT,
        meetingId: faker.string.alphanumeric(10),
        status: LiveSessionStatus.SCHEDULED,
        scheduledStart: start,
        scheduledEnd: end,
        host: { connect: { id: pick(instructors).id } },
        course: { connect: { id: pick(courses).id } },
      },
    });
    sessions.push(session);
  }
  return sessions;
}

async function seedEnrollmentsAndProgress(students: { id: string }[], courses: { id: string }[]) {
  console.log('Seeding enrollments + progress...');
  for (const student of students) {
    const enrolledCourses = pickMany(courses, faker.number.int({ min: 4, max: 10 }));

    for (const course of enrolledCourses) {
      await prisma.enrollment.create({
        data: {
          user: { connect: { id: student.id } },
          course: { connect: { id: course.id } },
          status: EnrollmentStatus.ACTIVE,
          pricePaid: 0,
        },
      });

      const lessons = await prisma.lesson.findMany({ where: { module: { courseId: course.id } } });
      const totalLessons = lessons.length;
      const completedCount = faker.number.int({ min: 0, max: totalLessons });
      const lessonsToComplete = pickMany(lessons, completedCount);

      for (const lesson of lessonsToComplete) {
        await prisma.lessonProgress.create({
          data: {
            user: { connect: { id: student.id } },
            lesson: { connect: { id: lesson.id } },
            status: LessonProgressStatus.COMPLETED,
            watchTimeSec: lesson.videoDurationSec ?? 300,
            lastPositionSec: lesson.videoDurationSec ?? 300,
            completedAt: faker.date.recent({ days: 20 }),
          },
        });
      }

      const completionPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 10000) / 100 : 0;
      await prisma.courseProgress.create({
        data: {
          user: { connect: { id: student.id } },
          course: { connect: { id: course.id } },
          completedLessons: completedCount,
          totalLessons,
          completionPercent,
          isCompleted: totalLessons > 0 && completedCount === totalLessons,
          totalWatchTimeSec: completedCount * 300,
        },
      });

      await prisma.course.update({ where: { id: course.id }, data: { enrollmentCount: { increment: 1 } } });
    }
  }
}

async function seedCommunity(allUsers: { id: string }[]) {
  console.log('Seeding 50 community posts + 300 comments...');
  const posts = [];
  for (let i = 0; i < 50; i++) {
    const post = await prisma.communityPost.create({
      data: {
        content: faker.lorem.paragraph(),
        mediaType: PostMediaType.NONE,
        author: { connect: { id: pick(allUsers).id } },
      },
    });
    posts.push(post);
  }

  const comments = [];
  for (let i = 0; i < 300; i++) {
    const post = pick(posts);
    const comment = await prisma.communityComment.create({
      data: {
        content: faker.lorem.sentence(),
        post: { connect: { id: post.id } },
        author: { connect: { id: pick(allUsers).id } },
      },
    });
    await prisma.communityPost.update({ where: { id: post.id }, data: { commentCount: { increment: 1 } } });
    comments.push(comment);
  }

  // A modest number of replies and likes for feature realism (not explicitly counted in spec).
  for (let i = 0; i < 100; i++) {
    const comment = pick(comments);
    await prisma.communityReply.create({
      data: {
        content: faker.lorem.sentence(),
        comment: { connect: { id: comment.id } },
        author: { connect: { id: pick(allUsers).id } },
      },
    });
    await prisma.communityComment.update({ where: { id: comment.id }, data: { replyCount: { increment: 1 } } });
  }

  for (let i = 0; i < 150; i++) {
    const post = pick(posts);
    const user = pick(allUsers);
    await prisma.communityLike
      .create({ data: { userId: user.id, postId: post.id } })
      .then(() => prisma.communityPost.update({ where: { id: post.id }, data: { likeCount: { increment: 1 } } }))
      .catch(() => undefined); // ignore duplicate like collisions from random sampling
  }
}

async function seedNotifications(students: { id: string }[]) {
  console.log('Seeding notifications...');
  for (const student of students) {
    const notification = await prisma.notification.create({
      data: {
        type: NotificationType.ANNOUNCEMENT,
        title: 'Welcome to the platform!',
        body: 'Explore courses, join live classes, and connect with the community.',
      },
    });
    await prisma.userNotification.create({
      data: { user: { connect: { id: student.id } }, notification: { connect: { id: notification.id } } },
    });
  }
}

async function main() {
  await seedRoles();
  const { admin, instructors, students } = await seedUsers();
  const categories = await seedCategories();
  const courses = await seedCoursesWithCurriculum(instructors, categories);
  await seedLiveSessions(instructors, courses);
  await seedEnrollmentsAndProgress(students, courses);
  await seedCommunity([admin, ...instructors, ...students]);
  await seedNotifications(students);

  console.log('\nSeed complete.');
  console.log('Login with any seeded user using password: Passw0rd!');
  console.log(`Admin: admin@edtech-lms.com`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
