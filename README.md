<h1 align="center">New API 特殊调用测试</h1>

<div align="center">
    <img src="example.png" alt="使用示例" />
</div>

纯前端的 [New API](https://github.com/QuantumNous/new-api) 调用测试页面，用来测试 OpenAI/Claude/Gemini 的一些特殊调用方式。所有数据仅在浏览器本地处理与保存。

本页面的主要代码与交互逻辑由 `GPT-5` 辅助完成，我提供了大量的功能设计提议与反馈。

## 功能特性

- **纯前端与本地存储：**
  - 所有配置保存在浏览器 LocalStorage 中
  - 不上传数据到第三方服务器，安全可控
- **多场景测试：**
  - OpenAI API 工具调用（`/v1/chat/completions`）
  - Claude API 工具调用（`/v1/messages`）
  - Gemini API 工具调用（`/v1beta/models`）
  - Gemini API 搜索（Google Search 工具）
  - Gemini API URL 上下文（URL Context 工具）
- **配置管理与一键默认：**
  - 通过“管理配置”弹窗新增/编辑/删除配置
  - 支持星标“默认配置”，页面加载自动应用
- **直观的可视化输出：**
  - 左侧“轮次与消息”时间线，右侧“请求与响应”代码块
  - 支持一键复制请求/响应内容
- **友好的错误与提示：**
  - 非 JSON 响应会在时间线中出现红色错误块，并附带“原始返回”详情
  - 若返回 HTML，会提示“您可能填写了错误的 API URL”
  - 未触发工具调用时显示黄色提示（可能是模型未理解或 API 异常）

## 如何使用

1. **直接打开页面：**
   - 用浏览器打开 https://cooksleep.github.io/newapi-special-test
2. **填写 API 信息：**
   - 在“API 配置”中填写 `API URL`、`API Key`、`模型`，或点击“管理配置”从右侧列表选择并应用。
3. **选择测试类型：**
   - 在“测试内容”中选择需要测试的类型（OpenAI API 工具调用 / Claude API 工具调用 / Gemini API 工具调用 / Gemini API 搜索 / Gemini API URL 上下文）。
4. **输入用户消息并发送：**
   - 在文本框输入用户消息，点击“发送测试请求”。
5. **查看结果：**
   - 左侧查看“轮次与消息”，右侧查看“请求与响应”。每个代码块都支持复制。

> 小贴士：该页面为纯前端网页，所有信息仅存储在您的浏览器本地。

## 修改默认系统配置

如需预置默认的 API URL、API Key、模型，可编辑 `assets/js/config.js` 中的 `window.APP_CONFIG`（部署到静态服务器时也可以按需修改）：

```js
window.APP_CONFIG = {
  apiUrl: 'https://api.openai.com',
  apiKey: '',
  model: 'gemini-2.5-pro'
};
```

- 该文件在页面加载时先于主脚本注入，主脚本会读取 `window.APP_CONFIG` 作为系统默认。
- 不建议在公共仓库提交真实的 API Key，可保持为空，使用时手动填写或通过“管理配置”保存到本地。

## 部署

- 本项目为静态页面，可直接托管至任意静态托管平台（GitHub Pages、Netlify、Vercel、Nginx 等）。
- 如需覆盖默认配置，直接修改 `assets/js/config.js` 并重新部署即可。

## 贡献

欢迎对项目进行改进！如果你有新的想法或想要完善交互，请提交 Issue 或 Pull Request。

## 许可证

本项目采用 [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html) 许可证，详情请见 [LICENSE](LICENSE) 文件。