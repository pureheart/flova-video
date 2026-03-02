---
name: flova-video
description: This skill should be used whenever the user mentions flova.ai, wants to create a video using flova, says "帮我做视频", "flova做视频", "用flova生成视频", "打开flova", "用隔离浏览器", or wants to automate AI video creation on flova.ai. Always use this skill when the user wants Claude to open a browser and create videos on flova.ai for them. Trigger on any combination of "视频", "flova", "isolated browser", "隔离浏览器".
version: 1.0.0
---

# Flova Video Skill

This skill automates AI video creation on [flova.ai](https://flova.ai) using an isolated Playwright browser session.

## Overview

Flova.ai is an all-in-one AI video and movie creation platform that integrates models like Sora, Veo, Gemini, and others. This skill launches an isolated browser (dedicated profile, separate from the user's normal browser) to open flova.ai and create videos.

## Workflow

### Step 1: Gather Requirements

Before opening the browser, ask the user:
1. **视频描述 (Video description)**: What should the video show? (中文或英文均可)
2. **时长 (Duration)**: How long? (e.g., 5s, 10s, 30s)
3. **风格 (Style)**: Cinematic, animation, realistic, etc.
4. **模型 (Model)**: Any preferred AI model? (Sora2, Veo3.1, default)
5. **是否已登录 (Logged in?)**: Do they already have a flova.ai account?

If the user provides a description directly (e.g., "帮我做一个关于...的视频"), extract what you can and proceed.

### Step 2: Launch Isolated Browser

Use the script at `${CLAUDE_PLUGIN_ROOT}/scripts/open_flova.js` to launch a Chromium browser with an isolated user data directory.

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/open_flova.js"
```

Or use npx playwright directly:
```bash
npx playwright open --browser chromium --user-data-dir ~/.flova-browser-profile https://flova.ai
```

The `--user-data-dir ~/.flova-browser-profile` flag creates an isolated profile so flova.ai sessions don't mix with the user's regular browser.

### Step 3: Browser Automation with Playwright

Use the full automation script for a guided flow:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/create_video.js" \
  --prompt "USER_PROMPT_HERE" \
  --duration "5" \
  --style "cinematic"
```

The script will:
1. Open flova.ai in an isolated Chromium browser (headed/visible mode)
2. Wait for user to log in if not already authenticated
3. Navigate to the video creation section
4. Fill in the prompt and settings
5. Submit the generation request
6. Wait and report back the result

### Step 4: Handle Login

If the user is not logged in, the browser will open and pause at the login page. Tell the user:
> "浏览器已打开，请在浏览器窗口中登录您的 flova.ai 账号，完成后告诉我。"

After user confirms login, continue the automation.

### Step 5: Monitor Progress

Flova.ai video generation can take time. Keep the browser open and:
- Poll for completion status
- Notify the user when the video is ready
- Provide the download/share link

## Script Usage

Read `${CLAUDE_PLUGIN_ROOT}/scripts/create_video.js` for the full automation script.
Read `${CLAUDE_PLUGIN_ROOT}/scripts/open_flova.js` for the simple browser-open script.

## Dependencies

- **Node.js**: Required (check with `node --version`)
- **Playwright**: Available via `npx playwright` (1.58.2+)
- **Browser**: Chromium (auto-downloaded by Playwright)

Install Playwright browsers if needed:
```bash
npx playwright install chromium
```

## Important Notes

- Always use `--user-data-dir ~/.flova-browser-profile` for isolation
- Run in headed mode (visible browser) so the user can see and interact
- If automation fails due to UI changes, fall back to opening the browser and guiding the user verbally
- The isolated profile persists login state between sessions
- Never store credentials in scripts; let the user log in manually

## Error Handling

| Error | Solution |
|-------|----------|
| Browser doesn't open | Run `npx playwright install chromium` first |
| Login required | Pause and let user log in manually |
| UI element not found | Fall back to `open_flova.js` (manual mode) |
| Generation timeout | Check flova.ai status page, notify user |
