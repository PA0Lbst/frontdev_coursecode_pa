import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { FriendRequestList } from "./FriendRequestList";

const meta = {
  title: "Organisms/FriendRequestList",
  component: FriendRequestList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: { include: ["incoming", "outgoing"] },
  },
  args: {
    incoming: [{ id: 1, user: { id: 2, username: "bob" } }],
    outgoing: [{ id: 2, user: { id: 3, username: "carol" } }],
    onAccept: fn(async () => {}),
    onDecline: fn(async () => {}),
    onCancel: fn(async () => {}),
  },
  argTypes: {
    onAccept: { table: { disable: true } },
    onDecline: { table: { disable: true } },
    onCancel: { table: { disable: true } },
  },
} satisfies Meta<typeof FriendRequestList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Accept bob" }));
    await expect(args.onAccept).toHaveBeenCalledWith(1);
  },
};
