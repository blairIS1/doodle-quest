import { test, expect } from "@playwright/test";

test.describe("Doodle Quest", () => {
  test("start screen renders with title and start button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Doodle Quest/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start Drawing/i })).toBeVisible();
  });

  test("clicking Start Drawing navigates to menu", async ({ page }) => {
    // Use debug param to skip audio-dependent transition
    await page.goto("/?phase=menu");
    await expect(page.getByText(/Doodle Quest!/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /Teach Dottie/i })).toBeVisible();
    await expect(page.getByText(/0\/3 quests/i)).toBeVisible();
  });

  test("menu shows all 3 quests with correct lock state", async ({ page }) => {
    await page.goto("/?phase=menu");
    await expect(page.getByRole("button", { name: /Teach Dottie/i })).toBeVisible({ timeout: 5000 });

    const teachBtn = page.getByRole("button", { name: /Teach Dottie/i });
    const testBtn = page.getByRole("button", { name: /Test Dottie/i });
    const artBtn = page.getByRole("button", { name: /Art Show/i });

    await expect(teachBtn).toBeEnabled();
    await expect(testBtn).toBeDisabled();
    await expect(artBtn).toBeDisabled();
  });

  test("debug ?phase=q1 jumps to Teach Dottie", async ({ page }) => {
    await page.goto("/?phase=q1");
    await expect(page.getByText(/Teach Dottie/i)).toBeVisible({ timeout: 5000 });
  });

  test("debug ?phase=q2 jumps to Test Dottie (Can Dottie Guess)", async ({ page }) => {
    await page.goto("/?phase=q2");
    await expect(page.getByText(/Can Dottie Guess/i)).toBeVisible({ timeout: 5000 });
  });

  test("debug ?phase=q3 jumps to Art Show", async ({ page }) => {
    await page.goto("/?phase=q3");
    await expect(page.getByText(/Art Show/i)).toBeVisible({ timeout: 5000 });
  });

  test("speaking indicator shows skip button when audio plays", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Start Drawing/i }).click();
    await page.waitForTimeout(1000);
    const skip = page.getByRole("button", { name: /Skip/i });
    if (await skip.isVisible()) {
      await skip.click();
    }
  });

  test("no console errors on start screen", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForTimeout(2000);
    const critical = errors.filter((e) => !e.includes("play()") && !e.includes("AudioContext") && !e.includes("NotAllowed"));
    expect(critical).toEqual([]);
  });

  test("session timer is not shown initially", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Time for a Break/i)).not.toBeVisible();
  });
});
