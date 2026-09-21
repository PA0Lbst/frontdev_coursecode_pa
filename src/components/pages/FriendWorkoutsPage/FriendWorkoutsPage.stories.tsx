import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { FriendWorkoutsPage } from "./FriendWorkoutsPage";

const meta = {
  title: "Pages/FriendWorkoutsPage",
  component: FriendWorkoutsPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { include: ["username", "friendUsername"] },
    nextjs: { appDirectory: true, navigation: { pathname: "/friends/bob" } },
  },
  args: {
    username: "alice",
    friendUsername: "bob",
    sessions: [
      {
        id: 4,
        userId: 2,
        name: "Push day",
        createdAt: new Date("2026-01-15T00:00:00.000Z"),
        setCount: 3,
      },
    ],
  },
  argTypes: {
    sessions: { table: { disable: true } },
  },
} satisfies Meta<typeof FriendWorkoutsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /Push day/ })).toHaveAttribute(
      "href",
      "/friends/bob/4",
    );
    await expect(
      canvas.queryByRole("button", { name: /Actions for/ }),
    ).not.toBeInTheDocument();
  },
};
