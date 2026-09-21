import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { WorkoutCard } from "./WorkoutCard";

const date = new Date("2026-01-15T00:00:00.000Z");

test("links to the workout and shows label and date", async () => {
  const screen = await render(
    <WorkoutCard id={7} label="Push day" date={date} exerciseCount={3} onDelete={vi.fn()} />,
  );
  const link = screen.getByRole("link");
  await expect.element(link).toHaveAttribute("href", "/workouts/7");
  await expect.element(link).toHaveTextContent("Push day");
  await expect.element(link).toHaveTextContent("15/01/2026");
});

test("pluralizes the exercise count", async () => {
  const zero = await render(
    <WorkoutCard id={1} label="A" date={date} exerciseCount={0} onDelete={vi.fn()} />,
  );
  await expect.element(zero.getByText("0 exercises")).toBeVisible();
  const one = await render(
    <WorkoutCard id={2} label="B" date={date} exerciseCount={1} onDelete={vi.fn()} />,
  );
  await expect.element(one.getByText("1 exercise", { exact: true })).toBeVisible();
  const three = await render(
    <WorkoutCard id={3} label="C" date={date} exerciseCount={3} onDelete={vi.fn()} />,
  );
  await expect.element(three.getByText("3 exercises")).toBeVisible();
});

test("menu Delete calls onDelete and closes the menu", async () => {
  const onDelete = vi.fn();
  const screen = await render(
    <WorkoutCard id={1} label="Push day" date={date} exerciseCount={0} onDelete={onDelete} />,
  );
  await screen.getByRole("button", { name: "Actions for Push day" }).click();
  await screen.getByRole("menuitem", { name: "Delete" }).click();
  expect(onDelete).toHaveBeenCalledTimes(1);
  await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
});

test("Escape closes the menu", async () => {
  const screen = await render(
    <WorkoutCard id={1} label="Push day" date={date} exerciseCount={0} onDelete={vi.fn()} />,
  );
  await screen.getByRole("button", { name: "Actions for Push day" }).click();
  await expect.element(screen.getByRole("menu")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
});

test("deleting disables the Delete item", async () => {
  const screen = await render(
    <WorkoutCard id={1} label="Push day" date={date} exerciseCount={0} onDelete={vi.fn()} deleting />,
  );
  await screen.getByRole("button", { name: "Actions for Push day" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Delete" }))
    .toBeDisabled();
});

test("href overrides the default link target", async () => {
  const screen = await render(
    <WorkoutCard id={7} href="/friends/bob/7" label="Push day" date={date} exerciseCount={3} />,
  );
  await expect.element(screen.getByRole("link")).toHaveAttribute("href", "/friends/bob/7");
});

test("without onDelete there is no actions menu", async () => {
  const screen = await render(
    <WorkoutCard id={1} label="Push day" date={date} exerciseCount={3} />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Actions for Push day" }))
    .not.toBeInTheDocument();
});
