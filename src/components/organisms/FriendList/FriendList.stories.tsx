import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { FriendList } from "./FriendList";

const meta = {
  title: "Organisms/FriendList",
  component: FriendList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: { include: ["friends"] },
  },
  args: {
    friends: [
      { id: 1, user: { id: 2, username: "bob" } },
      { id: 2, user: { id: 3, username: "carol" } },
    ],
    onRemove: fn(async () => {}),
  },
  argTypes: {
    onRemove: { table: { disable: true } },
  },
} satisfies Meta<typeof FriendList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole("link", { name: "bob" })).toHaveAttribute(
      "href",
      "/friends/bob",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Remove bob" }));
    await expect(args.onRemove).toHaveBeenCalledWith(1);
  },
};
