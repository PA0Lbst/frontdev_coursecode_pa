import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { WorkoutListPage } from "./WorkoutListPage";

const sampleSessions = [
  { id: 2, name: "Pull day", userId: 1, createdAt: new Date("2026-01-16T00:00:00.000Z"), setCount: 2 },
  { id: 1, name: null, userId: 1, createdAt: new Date("2026-01-15T00:00:00.000Z"), setCount: 0 },
];

const meta = {
  title: "Pages/WorkoutListPage",
  component: WorkoutListPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    initialSessions: sampleSessions,
    createSession: fn(async () => {}),
    deleteSession: fn(async () => {}),
  },
  argTypes: {
    initialSessions: { table: { disable: true } },
    createSession: { table: { disable: true } },
    deleteSession: { table: { disable: true } },
  },
} satisfies Meta<typeof WorkoutListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Name" }), "Leg day");
    await userEvent.click(canvas.getByRole("button", { name: "Add workout" }));
    await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("");
  },
};
