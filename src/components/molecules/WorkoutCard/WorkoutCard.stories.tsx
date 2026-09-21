import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { WorkoutCard } from "./WorkoutCard";

const meta = {
  title: "Molecules/WorkoutCard",
  component: WorkoutCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: { include: ["label", "date", "exerciseCount", "deleting"] },
  },
  args: {
    id: 1,
    label: "Push day",
    date: new Date("2026-01-15T00:00:00.000Z"),
    exerciseCount: 3,
    onDelete: fn(),
  },
  argTypes: {
    id: { table: { disable: true } },
    onDelete: { table: { disable: true } },
  },
} satisfies Meta<typeof WorkoutCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Push day" }));
    await userEvent.click(canvas.getByRole("menuitem", { name: "Delete" }));
    await expect(args.onDelete).toHaveBeenCalled();
  },
};
