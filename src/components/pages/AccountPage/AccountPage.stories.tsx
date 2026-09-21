import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { AccountPage } from "./AccountPage";

const passkeys = [
  { id: "a", label: "Laptop", createdAt: new Date("2026-01-15T00:00:00.000Z") },
  { id: "b", label: null, createdAt: new Date("2026-01-16T00:00:00.000Z") },
];

const meta = {
  title: "Pages/AccountPage",
  component: AccountPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    username: "alice",
    initialPasskeys: passkeys,
    startAddPasskey: fn(),
    finishAddPasskey: fn(),
    removePasskey: fn(async () => {}),
    signOut: fn(async () => {}),
  },
  argTypes: {
    username: { table: { disable: true } },
    initialPasskeys: { table: { disable: true } },
    startAddPasskey: { table: { disable: true } },
    finishAddPasskey: { table: { disable: true } },
    removePasskey: { table: { disable: true } },
    signOut: { table: { disable: true } },
  },
} satisfies Meta<typeof AccountPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove Laptop" }));
    await expect(args.removePasskey).toHaveBeenCalledWith("a");
    await expect(canvas.queryByText("Laptop")).toBeNull();
  },
};
