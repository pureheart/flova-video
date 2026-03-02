#!/usr/bin/env node
/**
 * flova-video MCP Server
 *
 * Exposes flova.ai video creation as MCP tools, compatible with
 * Claude Code, Cursor, Cline, Continue.dev, Windsurf, and any MCP-enabled agent.
 *
 * Tools:
 *   - create_video : Open flova.ai with prompt pre-filled, ready to generate
 *   - open_browser : Simply open flova.ai in an isolated browser
 */

const path = require('path');
const fs   = require('fs');

// Auto-install dependencies if missing
const ROOT = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(ROOT, 'node_modules', '@modelcontextprotocol', 'sdk'))) {
  process.stderr.write('[flova-video MCP] Dependencies missing. Running setup...\n');
  require('child_process').execSync('node scripts/setup.js', { cwd: ROOT, stdio: 'inherit' });
}

const { Server }               = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
}                              = require('@modelcontextprotocol/sdk/types.js');
const { spawn }                = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'create_video',
    description:
      'Open flova.ai in an isolated browser and pre-fill the video prompt. ' +
      'Use this when the user wants to create an AI video on flova.ai. ' +
      'The browser will open automatically with the prompt ready; the user just needs to click Generate.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Video description in English or Chinese (e.g. "Disney style wedding of Judy and Nick, 30s, festive atmosphere")',
        },
        duration: {
          type: 'number',
          description: 'Video duration in seconds (default: 5)',
        },
        style: {
          type: 'string',
          description: 'Video style hint appended to prompt (default: "cinematic")',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'open_browser',
    description:
      'Open flova.ai in an isolated browser window without pre-filling anything. ' +
      'Use this when the user just wants to browse flova.ai or log in.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ─── Helper: run a script as a detached background process ───────────────────

function spawnScript(scriptPath, args) {
  const child = spawn('node', [scriptPath, ...args], {
    detached: true,
    stdio: 'ignore',
    cwd: ROOT,
  });
  child.unref();
  return child.pid;
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'flova-video', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === 'create_video') {
    const { prompt, duration = 5, style = 'cinematic' } = args;

    const scriptArgs = [
      '--prompt', prompt,
      '--duration', String(duration),
      '--style', style,
      '--non-interactive',   // skip terminal waitForUser prompts
    ];

    const pid = spawnScript(
      path.join(ROOT, 'scripts', 'create_video.js'),
      scriptArgs
    );

    return {
      content: [
        {
          type: 'text',
          text: [
            `已在隔离浏览器中打开 flova.ai（进程 PID: ${pid}）。`,
            ``,
            `**Prompt 已预填：**`,
            `> ${prompt}（时长 ${duration}s，风格：${style}）`,
            ``,
            `**接下来请在浏览器中：**`,
            `1. 如未登录，请先登录（推荐邮箱密码，不要用 Google 登录）`,
            `2. 确认 prompt 内容正确`,
            `3. 选择合适的 AI 模型（Sora2 / Veo3.1 等）`,
            `4. 点击 Generate / 生成 按钮`,
            `5. 等待视频生成完成`,
          ].join('\n'),
        },
      ],
    };
  }

  if (name === 'open_browser') {
    const pid = spawnScript(
      path.join(ROOT, 'scripts', 'open_flova.js'),
      []
    );

    return {
      content: [
        {
          type: 'text',
          text: `已在隔离浏览器中打开 flova.ai（PID: ${pid}）。\n浏览器使用独立配置文件，不影响你的正常 Chrome。`,
        },
      ],
    };
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server runs until killed
}

main().catch(err => {
  process.stderr.write(`[flova-video MCP] Fatal: ${err.message}\n`);
  process.exit(1);
});
