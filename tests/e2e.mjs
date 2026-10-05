import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", msg => {
  if (msg.type() === "error") errors.push("console: " + msg.text());
});

const base = "http://127.0.0.1:8000/index.html";
await page.goto(base, { waitUntil: "networkidle" });

// Startup must not crash.
await page.locator("#startScreen").waitFor({ state: "visible" });
if (!(await page.locator("#gameScreen").evaluate(el => el.classList.contains("hidden")))) {
  throw new Error("Game screen should be hidden on startup");
}

// Help and settings from start screen.
await page.click("#helpBtnStart");
await page.locator("#helpModal").waitFor({ state: "visible" });
if ((await page.locator("#helpModal article").count()) < 10) throw new Error("Help modal is incomplete");
await page.click('#helpModal [data-close="helpModal"]');

await page.click("#settingsBtnStart");
await page.locator("#settingsModal").waitFor({ state: "visible" });
await page.fill("#musicVolume", "0");
await page.click('#settingsModal [data-close="settingsModal"]');

// Deterministic creative world.
await page.fill("#seedInput", "QA-SEED-2026");
await page.selectOption("#modeSelect", "creative");
await page.click("#newGameBtn");
await page.locator("#gameScreen").waitFor({ state: "visible" });

if ((await page.locator(".cell").count()) !== 2160) throw new Error("Expected 2160 world cells");
if ((await page.locator(".hotbar-slot").count()) !== 9) throw new Error("Expected 9 hotbar slots");
if ((await page.locator(".tool-card").count()) !== 4) throw new Error("Expected 4 tools");
if ((await page.textContent("#seedLabel")) !== "QA-SEED-2026") throw new Error("Seed label mismatch");

// Inventory and crafting shortcuts.
await page.keyboard.press("e");
await page.locator("#inventoryModal").waitFor({ state: "visible" });
if ((await page.locator(".inventory-slot").count()) < 10) throw new Error("Creative inventory too small");
await page.keyboard.press("Escape");

await page.keyboard.press("c");
await page.locator("#craftModal").waitFor({ state: "visible" });
if ((await page.locator(".recipe").count()) < 4) throw new Error("Crafting recipes missing");
await page.keyboard.press("Escape");

// Place a block via hotbar then undo/redo.
await page.keyboard.press("1");
const sky = page.locator('.cell[data-type="sky"]').first();
const skyIndex = await sky.getAttribute("data-index");
await sky.click();
let target = page.locator('.cell[data-index="' + skyIndex + '"]');
if ((await target.getAttribute("data-type")) !== "soil") throw new Error("Block placement failed");

await page.keyboard.press("Control+z");
if ((await target.getAttribute("data-type")) !== "sky") throw new Error("Undo failed");

await page.keyboard.press("Control+y");
if ((await target.getAttribute("data-type")) !== "soil") throw new Error("Redo failed");

// Mine a block in creative mode.
await page.getByRole("button", { name: "Axe", exact: true }).click();
const wood = page.locator('.cell[data-type="wood"]').first();
if (await wood.count()) {
  await wood.scrollIntoViewIfNeeded();
  await wood.hover();
  await page.mouse.down();
  await page.waitForTimeout(220);
  await page.mouse.up();
  await page.waitForTimeout(80);
  if ((await wood.getAttribute("data-type")) !== "sky") throw new Error("Mining failed");
}

// Save + reload + continue.
await page.click("#saveBtn");
const save = await page.evaluate(() => localStorage.getItem("minc_enhanced_save_v1"));
if (!save) throw new Error("Save was not written");

await page.screenshot({ path: "qa-screenshot.png", fullPage: true });
await page.reload({ waitUntil: "networkidle" });
await page.locator("#startScreen").waitFor({ state: "visible" });
if (await page.locator("#continueBtn").isDisabled()) throw new Error("Continue should be enabled after reload");
await page.click("#continueBtn");
await page.locator("#gameScreen").waitFor({ state: "visible" });
if ((await page.textContent("#seedLabel")) !== "QA-SEED-2026") throw new Error("Saved seed was not restored");

if (errors.length) throw new Error("Browser errors:\n" + errors.join("\n"));
console.log("E2E QA passed");
await browser.close();
