import { test, expect } from "@playwright/test";

import path from "node:path";

test("admin creates a client, manages delivery, and the client follows their project", async ({
  page,
}) => {
  const suffix = Date.now(),
    username = "client-" + suffix,
    password = "Client-test-password-123";

  const browserErrors: string[] = [];

  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/portal/login");

  await page.getByLabel("Username or email").fill("e2e-admin");

  await page
    .getByLabel("Password", { exact: true })
    .fill("E2e-admin-password-123");

  await page.getByRole("button", { name: /^Sign in/ }).click();

  await expect(
    page.getByRole("heading", { name: "A little clarity. A lot of progress." }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Clients/ }).click();

  await page.getByLabel("Username", { exact: true }).fill(username);

  await page
    .getByLabel("Email", { exact: true })
    .fill(username + "@example.com");

  await page.getByLabel("Initial password").fill(password);

  await page
    .getByLabel("Business name", { exact: true })
    .fill("Example Studio");

  await page
    .getByLabel("Business details, address and contact")
    .fill("Integration test client");

  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();

  await expect(page.getByText("Saved successfully.").first()).toBeVisible();

  await page
    .getByLabel("Select client")
    .selectOption({ label: "Example Studio" });

  await expect(
    page.getByRole("heading", { name: "Manage " + username }),
  ).toBeVisible();
  const clientID = await page.getByLabel("Select client").inputValue();

  await page.getByRole("link", { name: /Projects/ }).click();

  await page.getByLabel("Project name").fill("Client website");

  await page
    .getByLabel("Scope and overview")
    .fill("Design and build a new website.");

  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();

  await expect(
    page.getByRole("heading", { name: "Client website", exact: true }),
  ).toBeVisible();

  await page.getByText("+ Add phase", { exact: true }).click();

  await page
    .getByLabel("Phase title", { exact: true })
    .fill("Phase 1 - design");

  await page.getByLabel("Due date", { exact: true }).fill("2026-11-01");

  await page.getByLabel("Amount (USD)", { exact: true }).fill("250");

  await page.getByRole("button", { name: "Create phase", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Phase 1 - design", exact: true }),
  ).toBeVisible();

  await page.getByText("+ Add task", { exact: true }).click();

  await page
    .getByLabel("Task title", { exact: true })
    .fill("Design the homepage");

  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("todo");

  await page.getByRole("button", { name: "Create task", exact: true }).click();

  await expect(
    page.getByText("Design the homepage", { exact: true }),
  ).toBeVisible();

  await page
    .getByText("Edit project / halt or resume", { exact: true })
    .click();

  await page
    .getByRole("combobox", { name: "Project status", exact: true })
    .selectOption("halted");

  await page.getByLabel("Reason for halting").fill("Awaiting Phase 1 payment");

  await page
    .getByRole("button", { name: "Update project", exact: true })
    .click();

  await expect(
    page.getByText("Project progress is paused.", { exact: true }),
  ).toBeVisible();

  await page.screenshot({
    path: path.resolve("..", ".tmp", "admin-workspace.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "Sign out", exact: true }).click();

  await page.getByLabel("Username or email").fill(username);

  await page.getByLabel("Password", { exact: true }).fill(password);

  await page.getByRole("button", { name: /^Sign in/ }).click();

  await expect(
    page.getByRole("heading", { name: "Hello, Example Studio." }),
  ).toBeVisible();

  await expect(page.getByText("Client website is halted.")).toBeVisible();

  await page.getByRole("link", { name: /Projects/ }).click();

  await expect(
    page.getByText("Design the homepage", { exact: true }),
  ).toBeVisible();

  await page.getByText("Design the homepage", { exact: true }).click();

  await page
    .getByLabel("Comment", { exact: true })
    .fill("I will send the transfer reference today.");

  await page.getByRole("button", { name: "Add comment", exact: true }).click();

  await expect(
    page.getByText("I will send the transfer reference today.", {
      exact: true,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Payments/ }).click();

  await expect(page.getByText("$250.00")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });

  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();

  await page.getByRole("link", { name: /Support requests/ }).click();

  await page
    .getByLabel("Subject", { exact: true })
    .fill("Please review the design");

  await page
    .getByLabel("Describe the issue")
    .fill("Can we discuss the homepage layout?");

  await page
    .getByRole("button", { name: "Send support request", exact: true })
    .click();

  await expect(
    page.getByText("Please review the design", { exact: false }),
  ).toBeVisible();

  await page.screenshot({
    path: path.resolve("..", ".tmp", "client-mobile.png"),
    fullPage: true,
  });

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  const login = await page.request.post("/api/v1/auth/login", {
    headers: { Origin: "http://localhost:18443" },
    data: { identifier: "e2e-admin", password: "E2e-admin-password-123" },
  });
  expect(login.ok()).toBeTruthy();
  const reset = await page.request.post(
    "/api/v1/admin/clients/" + clientID + "/reset-link",
    { headers: { Origin: "http://localhost:18443" }, data: {} },
  );
  expect(reset.ok(), await reset.text()).toBeTruthy();
  const resetResult = await reset.json();
  await page.goto(resetResult.url);
  await page
    .getByLabel("New password", { exact: true })
    .fill("New-client-password-456");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("New-client-password-456");
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(
    page.getByText("Password updated. You can now sign in."),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("homepage and reset screens work without an authenticated session", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Development doesn.t end at launch/ }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Standard", exact: true }),
  ).toBeVisible();

  await page.screenshot({
    path: path.resolve("..", ".tmp", "homepage.png"),
    fullPage: false,
  });

  await page.goto("/portal/projects");

  await expect(page.getByRole("button", { name: /^Sign in/ })).toBeVisible();

  await page.goto("/portal/reset-password#token=invalid-token");

  await page
    .getByLabel("New password", { exact: true })
    .fill("New-password-for-test-123");

  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("New-password-for-test-123");

  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();

  await expect(page.getByRole("alert")).toContainText("invalid or expired");
});
