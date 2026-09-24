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
      include: ["username", "pendingRequestCount"],
    },
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
  },
  args: {
    username: "alice",
    pendingRequestCount: 2,
    onSignOut: fn(async () => {}),
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { name: "Gymtiiime" }),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Workouts" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("link", { name: /Friends/ })).toHaveAttribute(
      "href",
      "/friends",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Sign out" }));
    await expect(args.onSignOut).toHaveBeenCalled();
  },
};
