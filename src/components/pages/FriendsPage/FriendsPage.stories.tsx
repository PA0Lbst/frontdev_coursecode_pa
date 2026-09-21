import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { FriendsPage } from "./FriendsPage";

const meta = {
  title: "Pages/FriendsPage",
  component: FriendsPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { include: ["username"] },
    nextjs: { appDirectory: true, navigation: { pathname: "/friends" } },
  },
  args: {
    username: "alice",
    initialFriendships: {
      friends: [{ id: 1, user: { id: 2, username: "bob" } }],
      incoming: [],
      outgoing: [],
    },
    sendFriendRequest: fn(async (name: string) => ({
      entry: { id: 10, user: { id: 20, username: name } },
      status: "pending" as const,
    })),
    acceptFriendRequest: fn(async () => ({ id: 1, user: { id: 2, username: "x" } })),
    declineFriendRequest: fn(async () => {}),
    cancelFriendRequest: fn(async () => {}),
    removeFriend: fn(async () => {}),
  },
  argTypes: {
    initialFriendships: { table: { disable: true } },
    sendFriendRequest: { table: { disable: true } },
    acceptFriendRequest: { table: { disable: true } },
    declineFriendRequest: { table: { disable: true } },
    cancelFriendRequest: { table: { disable: true } },
    removeFriend: { table: { disable: true } },
  },
} satisfies Meta<typeof FriendsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Username" }), "carol");
    await userEvent.click(canvas.getByRole("button", { name: "Send request" }));
    await expect(args.sendFriendRequest).toHaveBeenCalledWith("carol");
    await expect(
      await canvas.findByRole("button", { name: "Cancel request to carol" }),
    ).toBeVisible();
  },
};
