import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { createServer } from "vite";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(os.tmpdir(), "tutorial-clinic-mobile-audit");
const browserCandidates = process.platform === "win32"
  ? [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    ]
  : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];

const studentRoutes = [
  "/dashboard", "/events", "/schedule", "/attendance", "/leaderboard", "/notes",
  "/my-notes", "/favourites", "/points-history", "/notifications", "/announcements",
  "/profile", "/settings", "/help",
];
const adminRoutes = [
  "/admin", "/admin/attendance", "/admin/sessions", "/admin/notes", "/admin/students",
  "/admin/subjects",
];
const screenshotRoutes = new Set([
  "/dashboard", "/events", "/schedule", "/attendance", "/leaderboard", "/notes", "/my-notes",
  "/notifications", "/profile", "/settings", "/admin", "/admin/attendance", "/admin/sessions",
  "/admin/notes", "/admin/students", "/admin/subjects",
]);
const viewports = [
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
];

async function findBrowser() {
  for (const candidate of browserCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next installed browser.
    }
  }
  throw new Error("Chrome, Edge, or Chromium was not found.");
}

async function inspectRoute(page, baseUrl, route, viewportName) {
  await page.goto(`${baseUrl}/#${route}`, { waitUntil: "networkidle" });
  await page.locator("#main-content").waitFor();
  await page.waitForTimeout(550);

  const result = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const main = document.querySelector("#main-content");
    const mobileNav = document.querySelector(".mobile-nav-bar");
    const offenders = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === "none" || style.visibility === "hidden" || rect.width < 1 || rect.height < 1) return false;
        const scrollContainer = element.parentElement?.closest(".table-scroll, [data-mobile-scroll]");
        if (scrollContainer) return false;
        return rect.left < -1 || rect.right > viewportWidth + 1;
      })
      .slice(0, 8)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 100) : "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 70) ?? "",
        };
      });

    const scrollTargets = main
      ? [main, ...main.querySelectorAll("*")].filter((element) => {
          const overflowY = getComputedStyle(element).overflowY;
          return ["auto", "scroll"].includes(overflowY) && element.scrollHeight > element.clientHeight + 2;
        })
      : [];
    const scrollTarget = scrollTargets.sort(
      (a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight),
    )[0];
    let scrollRange = 0;
    let scrollPosition = 0;
    let scrollTargetName = "";
    if (scrollTarget) {
      scrollRange = scrollTarget.scrollHeight - scrollTarget.clientHeight;
      scrollTarget.scrollTop = scrollTarget.scrollHeight;
      scrollPosition = scrollTarget.scrollTop;
      scrollTargetName = `${scrollTarget.tagName.toLowerCase()}.${String(scrollTarget.className).split(/\s+/).slice(0, 3).join(".")}`;
      scrollTarget.scrollTop = 0;
    }
    const mainBottom = main?.getBoundingClientRect().bottom ?? 0;
    const contentBoundary = mobileNav && getComputedStyle(mobileNav).display !== "none"
      ? mobileNav.getBoundingClientRect().top
      : window.innerHeight;

    return {
      viewportWidth,
      pageWidth: document.documentElement.scrollWidth,
      mainWidth: main?.scrollWidth ?? 0,
      mainBottom: Math.round(mainBottom),
      contentBoundary: Math.round(contentBoundary),
      mainFitsViewport: mainBottom <= contentBoundary + 1,
      scrollRange,
      scrollPosition,
      scrollTargetName,
      activeElement: document.activeElement?.className ?? document.activeElement?.tagName ?? "",
      skipLinkTransform: getComputedStyle(document.querySelector(".skip-link")).transform,
      offenders,
    };
  });

  const slug = route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "-");
  if (result.pageWidth > result.viewportWidth + 1 || result.offenders.length || screenshotRoutes.has(route)) {
    await page.screenshot({ path: path.join(outputDirectory, `${viewportName}-${slug}.png`), fullPage: true });
  }
  return { route, ...result };
}

async function signIn(page, baseUrl, studentId, viewportName) {
  await page.goto(`${baseUrl}/#/login`, { waitUntil: "networkidle" });
  if (viewportName === "phone-360") await page.screenshot({ path: path.join(outputDirectory, `${viewportName}-login.png`), fullPage: true });
  await page.getByLabel("Student ID").fill(studentId);
  await page.getByRole("button", { name: "Login" }).click();
  await page.locator("#main-content").waitFor();
}

async function assertPanelFits(page, selector, label) {
  const measurement = await page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { fits: rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.top >= -1 && rect.bottom <= window.innerHeight + 1, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
  });
  if (!measurement.fits) throw new Error(`${label} does not fit within the current mobile viewport: ${JSON.stringify(measurement)}`);
}

async function assertMobileDock(page) {
  const dock = page.locator(".mobile-nav-bar");
  const buttons = dock.locator(":scope > button");
  if (await buttons.count() !== 2) throw new Error("Mobile navigation must contain only QR mode and the navigation hub.");
  const labels = await buttons.evaluateAll((items) => items.map((item) => item.getAttribute("aria-label")));
  if (!labels.includes("Scan / QR") || !labels.includes("More")) throw new Error(`Unexpected mobile navigation actions: ${labels.join(", ")}.`);
}

async function auditInteractions(page, baseUrl, viewportName) {
  await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(550);
  await assertMobileDock(page);
  await page.getByRole("button", { name: "Scan / QR" }).click();
  await page.locator(".qr-mode-dialog").waitFor();
  await assertPanelFits(page, ".qr-mode-dialog", "QR mode dialog");
  await page.getByRole("tab", { name: "Generate QR" }).click();
  await page.locator(".qr-mode-code-panel svg").waitFor();
  await page.screenshot({ path: path.join(outputDirectory, `${viewportName}-qr-mode.png`) });
  await page.getByRole("button", { name: "Close QR mode" }).click();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.locator(".mobile-more-sheet").waitFor();
  await page.waitForTimeout(300);
  await assertPanelFits(page, ".mobile-more-sheet", "Mobile navigation sheet");
  const featureCount = await page.locator(".mobile-more-content .mobile-menu-group button").count();
  if (featureCount !== 15) throw new Error(`Student navigation hub should expose 15 features, but found ${featureCount}.`);
  await page.screenshot({ path: path.join(outputDirectory, `${viewportName}-more-menu.png`) });
  await page.getByRole("button", { name: "Close mobile navigation" }).click();

  await page.getByRole("button", { name: /unread notifications/ }).click();
  await page.locator(".notification-popover").waitFor();
  await assertPanelFits(page, ".notification-popover", "Notification popover");
  await page.screenshot({ path: path.join(outputDirectory, `${viewportName}-notification-popover.png`) });
  await page.getByRole("button", { name: "Close notifications" }).click();

  await page.getByRole("button", { name: "Open global search" }).click();
  await assertPanelFits(page, ".global-search-dialog", "Global search dialog");
  await page.screenshot({ path: path.join(outputDirectory, `${viewportName}-global-search.png`) });
  await page.getByRole("button", { name: "Close global search" }).click();

  await page.goto(`${baseUrl}/#/events`, { waitUntil: "networkidle" });
  await page.waitForTimeout(550);
  await page.getByRole("button", { name: "Show attendance QR" }).click();
  await page.locator(".qr-dialog").waitFor();
  await assertPanelFits(page, ".qr-dialog", "Attendance QR dialog");
  await page.screenshot({ path: path.join(outputDirectory, `${viewportName}-qr-dialog.png`) });
  await page.getByRole("button", { name: "Close QR code" }).click();

  await page.goto(`${baseUrl}/#/my-notes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(550);
  await page.getByRole("button", { name: "Upload note" }).click();
  await page.locator(".note-editor-dialog").waitFor();
  await page.screenshot({ path: path.join(outputDirectory, `${viewportName}-note-editor.png`) });
  await assertPanelFits(page, ".note-editor-dialog", "Note editor dialog");
  await page.getByRole("button", { name: "Close note editor" }).click();
}

async function switchUser(page, userId) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.evaluate((nextUserId) => {
      const key = "tutorial-clinic:demo:v1";
      const state = JSON.parse(localStorage.getItem(key));
      state.currentUserId = nextUserId;
      localStorage.setItem(key, JSON.stringify(state));
      window.location.reload();
    }, userId),
  ]);
}

const server = await createServer({ root: projectRoot, server: { host: "127.0.0.1", port: 0 } });
let browser;

try {
  await fs.mkdir(outputDirectory, { recursive: true });
  await server.listen();
  const address = server.httpServer.address();
  const port = typeof address === "object" && address ? address.port : 5173;
  const baseUrl = `http://127.0.0.1:${port}`;
  browser = await chromium.launch({ executablePath: await findBrowser(), headless: true });

  const report = [];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    await signIn(page, baseUrl, "2023-00117", viewport.name);
    for (const route of studentRoutes) report.push({ viewport: viewport.name, ...(await inspectRoute(page, baseUrl, route, viewport.name)) });
    await auditInteractions(page, baseUrl, viewport.name);
    await switchUser(page, "adm-001");
    for (const route of adminRoutes) report.push({ viewport: viewport.name, ...(await inspectRoute(page, baseUrl, route, viewport.name)) });
    await switchUser(page, "stu-042");
    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".setup-dialog").waitFor();
    await assertPanelFits(page, ".setup-dialog", "First-login setup dialog");
    await page.screenshot({ path: path.join(outputDirectory, `${viewport.name}-account-setup.png`) });
    await context.close();
  }

  const failures = report.filter((item) => item.pageWidth > item.viewportWidth + 1 || item.offenders.length || !item.mainFitsViewport || (item.scrollRange > 0 && item.scrollPosition <= 0));
  await fs.writeFile(path.join(outputDirectory, "report.json"), JSON.stringify(report, null, 2));
  console.log(`Mobile audit: ${report.length} route/viewport checks, ${failures.length} with visible overflow.`);
  console.log(`Report and screenshots: ${outputDirectory}`);
  if (failures.length) {
    for (const failure of failures) console.log(`${failure.viewport} ${failure.route}: page ${failure.pageWidth}px / viewport ${failure.viewportWidth}px; offenders ${failure.offenders.length}; main ${failure.mainBottom}px / boundary ${failure.contentBoundary}px; scroll ${failure.scrollPosition}/${failure.scrollRange}`);
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  await server.close();
}
