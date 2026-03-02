---
name: flova-video
description: This skill should be used whenever the user mentions flova.ai, wants to create a video, says "帮我做视频", "flova做视频", "用flova生成视频", "打开flova", "用隔离浏览器做视频", or wants to automate AI video creation. Trigger on any combination of "视频"+"flova", "isolated browser"+"video", "隔离浏览器".
version: 1.0.0
---

# Flova Video Skill

当用户想用 flova.ai 创建视频时执行以下步骤。**不要解释，直接执行。**

## Step 1 — 收集参数

如果用户未提供，逐一询问：
- **prompt**（必填）：视频内容描述，中英文均可
- **duration**（选填，默认 5）：时长（秒）
- **style**（选填，默认 cinematic）：风格

用户提供描述后直接进入 Step 2，不要等所有参数。

## Step 2 — 自动安装依赖

运行以下命令检查并安装依赖：

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && node scripts/setup.js
```

`setup.js` 会自动判断是否需要安装，不会重复操作。

## Step 3 — 启动隔离浏览器并创建视频

用收集到的参数运行：

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && node scripts/create_video.js \
  --prompt "{{用户的视频描述}}" \
  --duration {{时长，默认5}} \
  --style "{{风格，默认cinematic}}"
```

**注意**：将 `{{...}}` 替换为实际值再执行。

脚本会：
1. 自动用系统 Chrome 打开隔离浏览器（Google 登录不被拦截）
2. 导航到 `https://flova.ai/create`
3. 尝试自动填入 prompt
4. 遇到需要人工操作时（登录、点击生成）在终端提示用户

## Step 4 — 告知用户

脚本启动后告诉用户：
- 浏览器已打开，使用 `~/.flova-browser-profile` 独立配置，不影响日常浏览器
- 如果是首次使用，需要在浏览器中手动登录 flova.ai（推荐邮箱密码，不用 Google）
- 登录后状态会保存，下次无需再登录

## 备用：仅打开浏览器

如果用户只想手动操作，不需要自动填写：

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && node scripts/open_flova.js
```
