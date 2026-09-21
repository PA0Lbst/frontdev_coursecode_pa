import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { WorkoutSetItem } from "./WorkoutSetItem";

const sampleSet = {
  id: 1,
  sessionId: 1,
  createdAt: new Date("2026-01-15T00:00:00.000Z"),
  exercise: "Bench Press",
  reps: 8,
  weight: 60,
};

const meta = {
  title: "Molecules/WorkoutSetItem",
  component: WorkoutSetItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    set: sampleSet,
    onUpdate: fn(),
    onDelete: fn(),
  },
  argTypes: {
    onUpdate: { table: { disable: true } },
    onDelete: { table: { disable: true } },
  },
} satisfies Meta<typeof WorkoutSetItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
  },
};
