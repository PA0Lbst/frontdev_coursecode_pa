import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { WorkoutSetForm } from "./WorkoutSetForm";

const meta = {
  title: "Molecules/WorkoutSetForm",
  component: WorkoutSetForm,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    onAdd: fn(),
  },
  argTypes: {
    onAdd: { table: { disable: true } },
  },
} satisfies Meta<typeof WorkoutSetForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("combobox", { name: "Exercise" }),
      "Bench Press",
    );
    await userEvent.type(canvas.getByRole("spinbutton", { name: "Reps" }), "8");
    await userEvent.type(
      canvas.getByRole("spinbutton", { name: "Weight (kg)" }),
      "60",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
  },
};
