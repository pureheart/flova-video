#!/usr/bin/env node
/**
 * setup.js — Auto-install dependencies for flova-video
 *
 * Run this before using create_video.js or open_flova.js.
 * Safe to run multiple times; skips if already installed.
 *
 * Usage: node scripts/setup.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT          = path.resolve(__dirname, '..');
const NODE_MODULES  = path.join(ROOT, 'node_modules', '@playwright', 'test');
const PLAYWRIGHT_OK = path.join(ROOT, 'node_modules', '@modelcontextprotocol', 'sdk');

function run(cmd, label) {
  console.log(`[setup] ${label}...`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// 1. npm install (if node_modules missing)
if (!fs.existsSync(NODE_MODULES) || !fs.existsSync(PLAYWRIGHT_OK)) {
  run('npm install', 'Installing npm dependencies');
} else {
  console.log('[setup] npm dependencies: OK');
}

// 2. Playwright Chromium (if not downloaded)
try {
  execSync('npx playwright install --dry-run chromium 2>&1', { cwd: ROOT }).toString();
  // If dry-run passes without "will install", we're good
  console.log('[setup] Playwright Chromium: OK');
} catch {
  run('npx playwright install chromium', 'Downloading Playwright Chromium');
}

console.log('[setup] All dependencies ready. You can now run create_video.js or open_flova.js.');
