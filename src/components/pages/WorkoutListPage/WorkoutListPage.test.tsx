import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { WorkoutListPage } from "./WorkoutListPage";

const sampleSessions = [
  { id: 2, name: "Pull day", userId: 1, createdAt: new Date("2026-01-16T00:00:00.000Z"), setCount: 2 },
  { id: 1, name: null, userId: 1, createdAt: new Date("2026-01-15T00:00:00.000Z"), setCount: 0 },
];

function mockActions() {
  return {
    createSession: vi.fn(async (input: { name?: string | null }) => {
      void input;
    }),
    deleteSession: vi.fn(async (id: number) => {
      void id;
    }),
  };
}

test("empty list shows the empty message", async () => {
  const screen = await render(<WorkoutListPage {...mockActions()} />);
  await expect.element(screen.getByText("No workouts yet.")).toBeVisible();
});

test("renders labels with links to each workout", async () => {
  const screen = await render(
    <WorkoutListPage initialSessions={sampleSessions} {...mockActions()} />,
  );
  await expect
    .element(screen.getByRole("link", { name: /Pull day/ }))
    .toHaveAttribute("href", "/workouts/2");
  await expect
    .element(screen.getByRole("link", { name: /Untitled workout/ }))
    .toHaveAttribute("href", "/workouts/1");
});

test("create calls createSession with the name and clears the field", async () => {
  const actions = mockActions();
  const screen = await render(
    <WorkoutListPage initialSessions={sampleSessions} {...actions} />,
  );
  const input = screen.getByRole("textbox", { name: "Name" });
  await input.fill("Leg day");
  await screen.getByRole("button", { name: "Add workout" }).click();
  await expect.element(input).toHaveValue("");
  expect(actions.createSession).toHaveBeenCalledWith({ name: "Leg day" });
});

test("delete removes the workout", async () => {
  const actions = mockActions();
  const screen = await render(
    <WorkoutListPage initialSessions={sampleSessions} {...actions} />,
  );
  await screen
    .getByRole("listitem")
    .filter({ hasText: "Pull day" })
    .getByRole("button", { name: /Actions for/ })
    .click();
  await screen.getByRole("menuitem", { name: "Delete" }).click();
  await expect
    .element(screen.getByRole("link", { name: /Pull day/ }))
    .not.toBeInTheDocument();
  expect(actions.deleteSession).toHaveBeenCalledWith(2);
});

test("failed create shows an alert and leaves the list unchanged", async () => {
  const actions = {
    ...mockActions(),
    createSession: vi.fn(async () => {
      throw new Error("boom");
    }),
  };
  const screen = await render(
    <WorkoutListPage initialSessions={sampleSessions} {...actions} />,
  );
  await screen.getByRole("button", { name: "Add workout" }).click();
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Something went wrong. Try again.");
  expect(screen.getByRole("listitem").elements()).toHaveLength(2);
});

test("failed delete shows an alert and keeps the workout", async () => {
  const actions = {
    ...mockActions(),
    deleteSession: vi.fn(async () => {
      throw new Error("boom");
    }),
  };
  const screen = await render(
    <WorkoutListPage initialSessions={sampleSessions} {...actions} />,
  );
  await screen
    .getByRole("listitem")
    .filter({ hasText: "Pull day" })
    .getByRole("button", { name: /Actions for/ })
    .click();
  await screen.getByRole("menuitem", { name: "Delete" }).click();
  await expect.element(screen.getByRole("alert")).toBeVisible();
  await expect
    .element(screen.getByRole("link", { name: /Pull day/ }))
    .toBeVisible();
});
