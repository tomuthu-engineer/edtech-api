/* eslint-disable no-console */
import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

/**
 * Production-safe seed — the only thing this app cannot boot without.
 * Unlike prisma/seed.ts (dev/demo data: fake courses, a hardcoded-password
 * admin, fake community content), this creates zero content and never
 * overwrites an existing user.
 */
async function seedRoles() {
  console.log('Seeding roles...');
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `${name} role` } });
  }
}

/**
 * Optional: bootstraps the first SUPER_ADMIN from env vars so there's a
 * real login on day one. Skipped entirely if either var is unset. Safe to
 * re-run on every deploy — upserts on email, never touches an existing
 * user's password/roles once created.
 */
async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set — skipping admin bootstrap.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists — leaving it untouched.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.create({
    data: {
      firstName: 'Super',
      lastName: 'Admin',
      email,
      passwordHash,
      status: 'ACTIVE',
      isEmailVerified: true,
      roles: { create: [{ role: { connect: { name: RoleName.SUPER_ADMIN } } }] },
    },
  });
  console.log(`Created SUPER_ADMIN user: ${email}`);
}

async function main() {
  await seedRoles();
  await seedAdminUser();
  console.log('\nProduction seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
