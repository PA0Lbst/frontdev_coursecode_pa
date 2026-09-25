import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { SignInPage } from "./SignInPage";

const meta = {
  title: "Pages/SignInPage",
  component: SignInPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: {
    autoPrompt: false,
    startRegistration: fn(),
    finishRegistration: fn(),
    startAuthentication: fn(),
    finishAuthentication: fn(),
  },
  argTypes: {
    autoPrompt: { table: { disable: true } },
    startRegistration: { table: { disable: true } },
    finishRegistration: { table: { disable: true } },
    startAuthentication: { table: { disable: true } },
    finishAuthentication: { table: { disable: true } },
  },
} satisfies Meta<typeof SignInPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Username" }), "a");
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));
    await expect(canvas.getByRole("alert")).toBeVisible();
    await expect(args.startRegistration).not.toHaveBeenCalled();
  },
};
