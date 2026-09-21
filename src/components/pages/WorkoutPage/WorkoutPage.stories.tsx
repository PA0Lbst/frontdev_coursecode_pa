import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { WorkoutPage } from "./WorkoutPage";

const sampleSet = {
  id: 1,
  sessionId: 1,
  createdAt: new Date("2026-01-15T00:00:00.000Z"),
  exercise: "Bench Press",
  reps: 8,
  weight: 60,
};

const sampleSets = [
  sampleSet,
  {
    id: 2,
    sessionId: 1,
    createdAt: new Date("2026-01-16T00:00:00.000Z"),
    exercise: "Squat",
    reps: 5,
    weight: 100,
  },
];

const meta = {
  title: "Pages/WorkoutPage",
  component: WorkoutPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Push day",
    initialSets: sampleSets,
    createSet: fn(async (input) => ({
      id: 100,
      sessionId: 1,
      createdAt: new Date("2026-01-17T00:00:00.000Z"),
      exercise: input.exercise,
      reps: input.reps,
      weight: input.weight,
    })),
    updateSet: fn(async (input) => ({
      id: input.id,
      sessionId: 1,
      createdAt: new Date("2026-01-15T00:00:00.000Z"),
      exercise: input.exercise,
      reps: input.reps,
      weight: input.weight,
    })),
    deleteSet: fn(async () => {}),
  },
  argTypes: {
    title: { table: { disable: true } },
    initialSets: { table: { disable: true } },
    createSet: { table: { disable: true } },
    updateSet: { table: { disable: true } },
    deleteSet: { table: { disable: true } },
  },
} satisfies Meta<typeof WorkoutPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("combobox", { name: "Exercise" }),
      "Deadlift",
    );
    await userEvent.type(canvas.getByRole("spinbutton", { name: "Reps" }), "3");
    await userEvent.type(
      canvas.getByRole("spinbutton", { name: "Weight (kg)" }),
      "120",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(canvas.getByText("Deadlift")).toBeVisible();
  },
};
