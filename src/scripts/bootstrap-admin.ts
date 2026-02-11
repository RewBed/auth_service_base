import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../core/database/prisma.service';
import { UserRole, UserStatus } from 'generated/prisma/enums';
import { hashPassword } from '../user/password.util';

function getRequiredEnv(name: string): string {
  const rawValue = process.env[name];
  const value = rawValue?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const prisma = app.get(PrismaService);

    const username = getRequiredEnv('BOOTSTRAP_ADMIN_USERNAME');
    const password = getRequiredEnv('BOOTSTRAP_ADMIN_PASSWORD');
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() || null;

    const existingByUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingByUsername) {
      throw new Error(`User with username "${username}" already exists`);
    }

    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email },
      });
      if (existingByEmail) {
        throw new Error(`User with email "${email}" already exists`);
      }
    }

    const createdUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashPassword(password),
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: Boolean(email),
        isPhoneVerified: false,
      },
    });

    console.log('Admin user created successfully');
    console.log(`id=${createdUser.id}`);
    console.log(`username=${createdUser.username}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`bootstrap:admin failed: ${message}`);
  process.exit(1);
});
