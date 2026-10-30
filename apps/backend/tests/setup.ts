import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./contextflow.db";
}

import { prisma } from "../src/db/prisma";

beforeAll(async () => {
  // Ensure DB connection is active
  await prisma.$connect();
});

afterEach(async () => {
  // Clear tables between tests in clean dependency order
  await prisma.discussionLink.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.commit.deleteMany();
  await prisma.architectureSnapshot.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
