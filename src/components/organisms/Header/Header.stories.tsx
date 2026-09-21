import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Header } from "./Header";

const meta = {
  title: "Organisms/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: {
      include: ["username"],
    },
  },
  args: {
    username: "alice",
    onSignOut: fn(async () => {}),
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { name: "Workoutish" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Sign out" }));
    await expect(args.onSignOut).toHaveBeenCalled();
  },
};
