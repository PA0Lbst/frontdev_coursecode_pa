import { afterAll, beforeEach, vi } from "vitest";
import { cookieJar, resetCookies } from "./helpers/cookieStore";
import { prisma } from "@/prisma/prismaClient";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));

beforeEach(async () => {
  resetCookies();
  await prisma.workoutSet.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.authChallenge.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.passkey.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
