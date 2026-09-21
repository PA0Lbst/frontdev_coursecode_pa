import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { WorkoutSetList } from "./WorkoutSetList";

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
  title: "Organisms/WorkoutSetList",
  component: WorkoutSetList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    sets: sampleSets,
    onAdd: fn(),
    onUpdate: fn(),
    onDelete: fn(),
  },
  argTypes: {
    onAdd: { table: { disable: true } },
    onUpdate: { table: { disable: true } },
    onDelete: { table: { disable: true } },
  },
} satisfies Meta<typeof WorkoutSetList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
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
    expect(args.onAdd).toHaveBeenCalled();
  },
};
