import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ReadOnlyWorkoutPage } from "./ReadOnlyWorkoutPage";

const meta = {
  title: "Pages/ReadOnlyWorkoutPage",
  component: ReadOnlyWorkoutPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { include: ["username", "title", "backLabel"] },
    nextjs: { appDirectory: true, navigation: { pathname: "/friends/bob/4" } },
  },
  args: {
    username: "alice",
    title: "Push day",
    backHref: "/friends/bob",
    backLabel: "Back to bob's workouts",
    sets: [
      {
        id: 1,
        sessionId: 4,
        createdAt: new Date("2026-01-15T00:00:00.000Z"),
        exercise: "Bench Press",
        reps: 8,
        weight: 60,
      },
    ],
  },
  argTypes: {
    sets: { table: { disable: true } },
    backHref: { table: { disable: true } },
  },
} satisfies Meta<typeof ReadOnlyWorkoutPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Bench Press")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  },
};
