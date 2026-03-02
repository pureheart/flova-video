---
description: Open flova.ai in an isolated browser to create AI videos. Usage: /flova-video:flova [video description]
argument-hint: "[video description in Chinese or English]"
allowed-tools: Bash
---

# Flova Video Creator

You are helping the user create an AI video on flova.ai using an isolated browser.

<user-request>
$ARGUMENTS
</user-request>

## Your Task

1. If `$ARGUMENTS` is empty, ask the user for their video description.
2. Gather any missing details (duration, style, model preference).
3. Check if Playwright browsers are installed:
   ```bash
   npx playwright install --dry-run chromium 2>&1 | head -5
   ```
4. If needed, install Chromium:
   ```bash
   npx playwright install chromium
   ```
5. Run the video creation script:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/create_video.js" --prompt "DESCRIPTION" --duration 5 --style cinematic
   ```
6. Guide the user through any manual steps (login, submit).
7. Report back with the result.

Replace DESCRIPTION with the user's actual video description.
