#!/usr/bin/env node
/**
 * open_flova.js - Open flova.ai in an isolated browser profile
 *
 * Uses system Google Chrome when available to avoid Google login bot detection.
 *
 * Usage: node open_flova.js
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATHS = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux:  '/usr/bin/google-chrome',
  win32:  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
};
const SYSTEM_CHROME   = CHROME_PATHS[process.platform];
const USE_SYSTEM_CHROME = SYSTEM_CHROME && fs.existsSync(SYSTEM_CHROME);
const PROFILE_DIR     = path.join(os.homedir(), '.flova-browser-profile');

async function main() {
  console.log('[flova-video] Opening isolated browser...');
  console.log(`[flova-video] Engine: ${USE_SYSTEM_CHROME ? 'System Chrome (Google login OK)' : 'Playwright Chromium'}`);
  console.log(`[flova-video] Profile: ${PROFILE_DIR}`);

  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    executablePath: USE_SYSTEM_CHROME ? SYSTEM_CHROME : undefined,
    viewport: { width: 1400, height: 900 },
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = browser.pages()[0] || await browser.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  await page.goto('https://flova.ai', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('[flova-video] Browser open. Close the window when done.');

  // Keep alive until browser closes
  await new Promise(resolve => browser.on('disconnected', resolve));
  console.log('[flova-video] Browser closed.');
}

main().catch(err => {
  console.error('[flova-video] Error:', err.message);
  process.exit(1);
});
