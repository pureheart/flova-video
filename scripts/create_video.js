#!/usr/bin/env node
/**
 * create_video.js - Automate video creation on flova.ai
 *
 * Uses the system-installed Google Chrome to avoid bot detection on Google login.
 *
 * Usage:
 *   node create_video.js --prompt "A cinematic sunset over mountains" [--duration 5] [--style cinematic]
 *
 * Options:
 *   --prompt    Video description (required)
 *   --duration  Video duration in seconds (default: 5)
 *   --style     Video style hint (default: cinematic)
 *   --headless  Run in headless mode (default: false, shows browser)
 */

const path = require('path');
const os   = require('os');
const fs   = require('fs');

// Auto-install dependencies if missing
const ROOT = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(ROOT, 'node_modules', '@playwright', 'test'))) {
  console.log('[flova-video] Dependencies missing. Running setup...');
  require('child_process').execSync('node scripts/setup.js', { cwd: ROOT, stdio: 'inherit' });
}

const { chromium } = require('@playwright/test');

// Locate the real system Chrome (avoids Google bot detection)
const CHROME_PATHS = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
};
const SYSTEM_CHROME = CHROME_PATHS[process.platform];
const USE_SYSTEM_CHROME = SYSTEM_CHROME && fs.existsSync(SYSTEM_CHROME);

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const PROMPT          = getArg('prompt');
const DURATION        = getArg('duration') || '5';
const STYLE           = getArg('style') || 'cinematic';
const HEADLESS        = args.includes('--headless');
const NON_INTERACTIVE = args.includes('--non-interactive'); // MCP mode: no stdin prompts
const PROFILE_DIR     = path.join(os.homedir(), '.flova-browser-profile');

if (!PROMPT) {
  console.error('Error: --prompt is required');
  console.error('Usage: node create_video.js --prompt "Your video description"');
  process.exit(1);
}

async function waitForUser(message) {
  console.log(`\n[ACTION REQUIRED] ${message}`);
  if (NON_INTERACTIVE) {
    // MCP mode: don't block on stdin, browser stays open for user to interact
    console.log('[Non-interactive mode: skipping ENTER prompt, browser will stay open]');
    return;
  }
  console.log('[Press ENTER in this terminal when done...]');
  await new Promise(resolve => {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });
}

async function main() {
  if (USE_SYSTEM_CHROME) {
    console.log('[flova-video] Using system Google Chrome (avoids Google login blocks)');
  } else {
    console.log('[flova-video] System Chrome not found, using Playwright Chromium');
    console.log('[flova-video] Note: Google OAuth login may be blocked. Use email/password login instead.');
  }

  console.log(`[flova-video] Prompt: ${PROMPT}`);
  console.log(`[flova-video] Duration: ${DURATION}s | Style: ${STYLE}`);
  console.log(`[flova-video] Profile: ${PROFILE_DIR}`);

  const launchOptions = {
    headless: HEADLESS,
    viewport: { width: 1400, height: 900 },
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
  };

  if (USE_SYSTEM_CHROME) {
    launchOptions.executablePath = SYSTEM_CHROME;
  }

  const browser = await chromium.launchPersistentContext(PROFILE_DIR, launchOptions);
  const page = browser.pages()[0] || await browser.newPage();

  // Mask automation fingerprint
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    console.log('[flova-video] Opening flova.ai...');
    await page.goto('https://flova.ai', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const isLoginPage = /login|signin|auth/i.test(currentUrl);

    if (isLoginPage) {
      console.log('[flova-video] Login page detected.');
      await waitForUser(
        '请在浏览器中登录 flova.ai（推荐使用邮箱密码，而非 Google 登录）\n' +
        '登录完成后，请按 ENTER 继续。\n' +
        '(Log in to flova.ai. Prefer email/password over Google login. Press ENTER when done.)'
      );
    }

    // Navigate to create page
    console.log('[flova-video] Navigating to video creation page...');
    const createUrls = [
      'https://www.flova.ai/zh-CN/create',
      'https://www.flova.ai/create',
      'https://flova.ai/create',
    ];

    let navigated = false;
    for (const url of createUrls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(2000);
        if (!/404|error/i.test(page.url())) {
          console.log(`[flova-video] Create page: ${page.url()}`);
          navigated = true;
          break;
        }
      } catch { /* try next */ }
    }

    if (!navigated) {
      await waitForUser(
        '无法自动进入创作页面，请手动导航到视频创建页面，完成后按 ENTER。\n' +
        '(Cannot auto-navigate. Please go to the video creation page manually, then press ENTER.)'
      );
    }

    // Fill prompt
    console.log('[flova-video] Looking for prompt input...');
    const promptSelectors = [
      'textarea[placeholder*="prompt" i]',
      'textarea[placeholder*="describe" i]',
      'textarea[placeholder*="描述"]',
      'textarea[placeholder*="输入"]',
      'textarea',
      '[contenteditable="true"]',
    ];

    let filled = false;
    for (const sel of promptSelectors) {
      try {
        const el = await page.$(sel);
        if (el && await el.isVisible()) {
          await el.click();
          await page.keyboard.selectAll();
          await el.fill(`${PROMPT} (duration: ${DURATION}s, style: ${STYLE})`);
          console.log(`[flova-video] Prompt filled via: ${sel}`);
          filled = true;
          break;
        }
      } catch { /* try next */ }
    }

    if (!filled) {
      await waitForUser(
        `请手动将以下描述粘贴到视频 prompt 输入框中，完成后按 ENTER:\n\n` +
        `"${PROMPT} (duration: ${DURATION}s, style: ${STYLE})"\n\n` +
        `(Paste the above into the prompt field, then press ENTER.)`
      );
    }

    // Click generate
    console.log('[flova-video] Looking for generate button...');
    const submitSelectors = [
      'button:has-text("Generate")',
      'button:has-text("生成")',
      'button:has-text("Create")',
      'button:has-text("创建")',
      'button:has-text("Run")',
      'button[type="submit"]',
    ];

    let submitted = false;
    for (const sel of submitSelectors) {
      try {
        const el = await page.$(sel);
        if (el && await el.isVisible()) {
          console.log(`[flova-video] Clicking: ${sel}`);
          await el.click();
          submitted = true;
          break;
        }
      } catch { /* try next */ }
    }

    if (!submitted) {
      await waitForUser(
        '请手动点击"生成"按钮，完成后按 ENTER。\n' +
        '(Click the Generate button manually, then press ENTER.)'
      );
    }

    console.log('\n[flova-video] Generation started! Watch the browser for progress.');
    if (NON_INTERACTIVE) {
      // MCP mode: keep browser open, script exits but browser stays (detached)
      console.log(`\n[flova-video] Browser open at: ${page.url()}`);
      console.log('[flova-video] MCP mode: exiting script, browser stays open for user.');
      return;
    }

    await waitForUser(
      '视频生成中，请在浏览器中查看进度。\n完成后按 ENTER 关闭浏览器。\n' +
      '(Video is generating. Press ENTER when done to close the browser.)'
    );

    console.log(`\n[flova-video] Done! Final page: ${page.url()}`);

  } catch (err) {
    console.error('[flova-video] Error:', err.message);
    if (!NON_INTERACTIVE) {
      await waitForUser(
        '发生错误，请手动完成后按 ENTER 退出。\n' +
        '(Error occurred. Complete manually, then press ENTER.)'
      );
    }
  } finally {
    if (!NON_INTERACTIVE) {
      await browser.close();
      console.log('[flova-video] Browser closed.');
    }
  }
}

main().catch(err => {
  console.error('[flova-video] Fatal:', err.message);
  process.exit(1);
});
