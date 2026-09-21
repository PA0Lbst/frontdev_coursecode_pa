import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { PageTemplate } from "./PageTemplate";

test("renders banner and no footer", async () => {
  const screen = await render(
    <PageTemplate>
      <p>Slot content</p>
    </PageTemplate>,
  );
  await expect.element(screen.getByRole("banner")).toBeVisible();
  await expect.element(screen.getByRole("contentinfo")).not.toBeInTheDocument();
});

test("given children, those children are inside main", async () => {
  const screen = await render(
    <PageTemplate>
      <p>Slot content</p>
    </PageTemplate>,
  );
  await expect
    .element(screen.getByRole("main").getByText("Slot content"))
    .toBeVisible();
});
