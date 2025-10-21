# New API 特殊调用测试 - 项目文档

## 项目概述

这是一个**纯前端静态网页应用**，用于测试 [New API](https://github.com/QuantumNous/new-api) 对 OpenAI、Claude 和 Gemini API 的特殊调用方式。所有数据处理和配置存储均在浏览器本地完成，不涉及后端服务器。

### 核心特性

- **纯前端架构**：使用原生 HTML/CSS/JavaScript 实现，无需构建工具或框架
- **本地存储**：所有 API 配置保存在浏览器 LocalStorage 中
- **多场景测试**：支持 5 种不同的 API 调用场景
- **配置管理**：支持多配置保存、编辑、删除和默认配置设置
- **可视化输出**：双栏展示请求/响应和消息时间线

### 技术栈

- **前端**：原生 JavaScript (ES6+)
- **样式**：纯 CSS（渐变背景、自定义滚动条、响应式布局）
- **存储**：LocalStorage API
- **部署**：GitHub Pages（通过 GitHub Actions 自动部署）

## 项目结构

```
/media/code/llm/newapi-special-test/
├── index.html              # 主页面（包含完整 UI 结构）
├── README.md               # 项目说明文档
├── LICENSE                 # GNU GPL v3.0 许可证
├── example.png             # 使用示例截图
├── .nojekyll              # 禁用 Jekyll 处理
├── GEMINI.md              # Gemini 相关文档
├── .github/
│   └── workflows/
│       └── static.yml     # GitHub Pages 部署工作流
└── assets/
    ├── css/
    │   └── styles.css     # 全局样式表
    └── js/
        ├── config.js      # 系统默认配置（可自定义）
        └── script.js      # 主要业务逻辑
```

## 核心功能模块

### 1. API 配置管理 (`script.js`)

- **配置存储**：使用 `localStorage.getItem('apiConfigs')` 存储配置数组
- **默认配置**：支持标记某个配置为默认，页面加载时自动应用
- **配置操作**：
  - 新增配置：`saveConfigBtn` 事件处理
  - 编辑配置：`editingIndex` 状态管理
  - 删除配置：二次确认机制（点击两次才删除）
  - 设为默认：`star-config` 按钮切换

### 2. 测试场景 (`script.js`)

支持 5 种测试场景，通过分段控制器 (`.segmented`) 切换：

#### 场景 1：OpenAI API 工具调用 (`openai_tools`)

- **端点**：`/v1/chat/completions`
- **流程**：
  1. 发送带 `tools` 参数的请求
  2. 模型返回 `tool_calls`
  3. 模拟工具执行（获取当前时间）
  4. 将工具结果作为 `role: 'tool'` 消息发送
  5. 获取最终回答

#### 场景 2：Claude API 工具调用 (`anthropic_tools`)

- **端点**：`/v1/messages`
- **特殊头部**：`x-api-key` 和 `anthropic-version: 2023-06-01`
- **流程**：
  1. 发送带 `tools` 参数的请求
  2. 检测响应中的 `tool_use` 类型内容
  3. 模拟工具执行
  4. 将工具结果作为 `tool_result` 发送
  5. 获取最终回答

#### 场景 3：Gemini API 工具调用 (`gemini_tools`)

- **端点**：`/v1beta/models/{model}:generateContent?key={apiKey}`
- **流程**：
  1. 发送带 `functionDeclarations` 的请求
  2. 检测响应中的 `functionCall`
  3. 模拟工具执行
  4. 将工具结果作为 `functionResponse` 发送
  5. 获取最终回答

#### 场景 4：Gemini API 搜索 (`gemini_search`)

- **工具**：`{ googleSearch: {} }`
- **用途**：调用 Google Search 工具进行实时搜索

#### 场景 5：Gemini API URL 上下文 (`gemini_url_context`)

- **工具**：`{ urlContext: {} }`
- **用途**：从 URL 中提取上下文信息

### 3. UI 交互组件

#### 密码显示/隐藏 (`password-toggle`)

- 切换 `input.type` 在 `password` 和 `text` 之间
- 切换眼睛图标显示状态

#### 模态框系统

- **配置管理模态框** (`#configModal`)：管理 API 配置
- **自定义提示框** (`.app-modal`)：替代原生 `alert`/`confirm`
  - `appAlert(message, title)`：单按钮提示
  - `appConfirm(message, title)`：双按钮确认

#### 消息时间线 (`#messageTimeline`)

- 显示每轮对话的消息
- 不同角色用不同颜色边框标识：
  - `user`：蓝色 (`#1e90ff`)
  - `assistant`：绿色 (`#22c55e`)
  - `tool`：紫色 (`#7c3aed`)
- 支持等待动画 (`.waiting-inline`)
- 支持错误提示 (`.error-inline`)
- 支持信息提示 (`.info-inline`)

#### 请求/响应块 (`#blocksContainer`)

- 显示完整的请求和响应 JSON
- 每个代码块支持一键复制

### 4. 错误处理

- **非 JSON 响应**：显示红色错误块，附带原始返回内容
- **HTML 响应检测**：提示"您可能填写了错误的 API URL"
- **未触发工具调用**：显示黄色提示信息
- **网络错误**：捕获并显示 HTTP 状态码和错误信息

## 配置说明

### 系统默认配置 (`assets/js/config.js`)

```javascript
window.APP_CONFIG = {
  apiUrl: 'https://api.openai.com',  // 默认 API URL
  apiKey: '',                         // 默认 API Key（建议留空）
  model: 'gemini-2.5-pro'            // 默认模型
};
```

**修改方式**：

- 直接编辑 `assets/js/config.js` 文件
- 部署到静态服务器时可按需修改
- **注意**：不要在公共仓库提交真实的 API Key

### 用户配置存储

配置保存在 `localStorage.apiConfigs`，格式为：

```javascript
[
  {
    name: "配置名称",
    url: "https://api.example.com",
    key: "sk-xxx",
    model: "gpt-4",
    isDefault: true  // 是否为默认配置
  }
]
```

## 部署指南

### 本地运行

由于是纯静态页面，直接用浏览器打开 `index.html` 即可。

**推荐使用本地服务器**（避免 CORS 问题）：

```bash
# Python 3
python -m http.server 8000

# Node.js (需要安装 http-server)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000`

### GitHub Pages 部署

项目已配置自动部署（`.github/workflows/static.yml`）：

1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发部署
3. 访问 `https://<username>.github.io/newapi-special-test`

**手动部署到其他平台**：

- **Netlify**：拖拽整个项目文件夹到 Netlify
- **Vercel**：导入 GitHub 仓库
- **Nginx**：将文件复制到 web 根目录

## 开发约定

### 代码风格

- **JavaScript**：

  - 使用 IIFE（立即执行函数）封装全局作用域
  - 使用 `const`/`let`，避免 `var`
  - 使用箭头函数和模板字符串
  - 工具函数前置定义
- **CSS**：

  - 使用 CSS 变量（`--sb-track`, `--sb-thumb` 等）
  - BEM 命名约定（如 `.config-item`, `.modal-content`）
  - 移动端优先的响应式设计（`@media (max-width: 900px)`）
- **HTML**：

  - 语义化标签（`<header>`, `<main>`, `<section>`）
  - 无障碍属性（`aria-label`, `aria-hidden`）

### 关键函数说明

#### `buildEndpoint(base)` / `buildGeminiEndpoint(base, model, apiKey)`

构建不同 API 的完整端点 URL

#### `fetchAndParse(url, options)`

统一的网络请求处理，返回 `{ json, text, contentType }`

#### `addMessage(role, label, payload)`

在时间线中添加消息卡片

#### `addBlock(title, payload)`

在右侧添加请求/响应代码块

#### `addInlineError(text, raw)`

在时间线中添加错误提示（支持原始内容展开）

#### `scrollLatestIntoView()`

将最新消息滚动到页面顶部

## 测试流程

### 基本测试步骤

1. **填写 API 配置**：

   - 输入 API URL（如 `https://api.openai.com`）
   - 输入 API Key
   - 输入模型名称（如 `gpt-4`）
2. **选择测试场景**：

   - 点击分段控制器选择测试类型
   - 系统会自动填充对应的默认消息
3. **发送请求**：

   - 点击"发送测试请求"按钮
   - 观察左侧时间线和右侧请求/响应
4. **查看结果**：

   - 左侧显示消息流程
   - 右侧显示完整的 JSON 数据
   - 支持复制任意代码块

### 调试技巧

- **查看控制台**：所有错误会同时输出到浏览器控制台
- **检查网络请求**：使用浏览器开发者工具的 Network 标签
- **清空结果**：点击"清空结果"按钮重置界面
- **切换场景自动清空**：切换测试类型时会自动清空历史记录

## 常见问题

### 1. 为什么返回 HTML 而不是 JSON？

**原因**：API URL 填写错误，指向了网页而不是 API 端点

**解决**：

- 检查 URL 是否正确（应该是 API 端点，不是网页地址）
- OpenAI 格式：`https://api.openai.com`
- Gemini 格式：`https://generativelanguage.googleapis.com`

### 2. 为什么没有触发工具调用？

**可能原因**：

- 模型不支持工具调用（如某些旧版本模型）
- 用户消息不够明确，模型未理解需要调用工具
- API 配置错误或权限不足

**解决**：

- 使用支持工具调用的模型（如 `gpt-4`, `claude-3-opus`, `gemini-pro`）
- 修改用户消息，使其更明确地需要工具（如"当前时间是？"）

### 3. 如何保存多个配置？

1. 点击"管理配置"按钮
2. 在左侧表单填写配置信息
3. 点击"保存配置"或"保存为默认配置"
4. 在右侧列表中可以查看、编辑、删除配置

### 4. 如何设置默认配置？

**方法 1**：在配置列表中点击星标按钮
**方法 2**：在添加/编辑配置时点击"保存为默认配置"

默认配置会在页面加载时自动应用到顶部表单。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交 PR 前请确保：

1. 代码风格与现有代码一致
2. 测试所有 5 种场景是否正常工作
3. 检查响应式布局（移动端和桌面端）
4. 更新 README.md（如有新功能）

### 建议改进方向

- [ ] 支持更多 API 提供商（如 Anthropic 原生端点）
- [ ] 添加请求历史记录功能
- [ ] 支持导出/导入配置
- [ ] 添加暗色主题
- [ ] 支持流式响应（SSE）

## 许可证

本项目采用 [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html) 许可证。

详见 [LICENSE](LICENSE) 文件。

## 相关链接

- **在线演示**：https://cooksleep.github.io/newapi-special-test
- **GitHub 仓库**：https://github.com/CookSleep/newapi-special-test
- **New API 项目**：https://github.com/QuantumNous/new-api

---

**最后更新**：2025-10-21
