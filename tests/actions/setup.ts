import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/prisma/prismaClient";

beforeEach(async () => {
  await prisma.workoutSet.deleteMany();
  await prisma.workoutSession.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
