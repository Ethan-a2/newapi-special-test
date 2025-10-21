# 调试指南

本文档提供 New API 特殊调用测试项目的完整调试方法和技巧。

## 目录

- [浏览器开发者工具](#浏览器开发者工具)
- [添加调试代码](#添加调试代码)
- [检查 LocalStorage](#检查-localstorage)
- [测试特定场景](#测试特定场景)
- [模拟 API 响应](#模拟-api-响应)
- [常见问题排查](#常见问题排查)
- [网络请求调试](#网络请求调试技巧)
- [性能调试](#性能调试)
- [移动端调试](#移动端调试)
- [快速调试脚本](#快速调试脚本)

---

## 浏览器开发者工具

### 打开方式

- **Chrome/Edge**: `F12` 或 `Ctrl+Shift+I` (Linux/Windows)
- **Firefox**: `F12` 或 `Ctrl+Shift+I`
- **Safari**: `Cmd+Option+I` (需先在设置中启用开发者菜单)

### 关键标签页

#### 1. Console (控制台)

所有错误会自动输出到控制台，可以查看：
- JavaScript 运行时错误
- `console.log()` 输出的调试信息
- 网络请求失败信息

**使用技巧**：
```javascript
// 查看所有错误堆栈
// 使用过滤器只显示错误/警告
// 清空控制台：右键 → Clear console 或 Ctrl+L
```

#### 2. Network (网络)

查看所有 HTTP 请求，包括：
- 请求 URL 和方法 (GET/POST)
- 请求头 (Headers)
- 请求体 (Payload/Request Body)
- 响应状态码 (200, 400, 401, 500 等)
- 响应内容 (Response)
- 响应时间和大小

**使用技巧**：
1. 点击具体请求查看详情
2. 右键请求 → Copy → Copy as cURL 可以在命令行重现请求
3. 使用过滤器只显示 XHR/Fetch 请求
4. 勾选 "Preserve log" 保留页面刷新前的请求记录

#### 3. Application (应用)

查看浏览器存储：
- **Local Storage** → 查看 `apiConfigs` 存储的配置
- **Session Storage** → 查看会话存储
- **Cookies** → 查看 Cookie

**使用技巧**：
- 双击值可以直接编辑
- 右键可以删除单个或全部条目
- 可以手动添加新的键值对

#### 4. Sources (源代码)

调试 JavaScript 代码：
- 在代码行号左侧点击设置断点
- 使用 `debugger;` 语句强制断点
- 单步执行 (F10)、步入 (F11)、步出 (Shift+F11)
- 查看变量值和调用堆栈

**使用技巧**：
1. 在 `assets/js/script.js` 中设置断点
2. 触发操作（如点击"发送测试请求"）
3. 代码会在断点处暂停
4. 鼠标悬停在变量上查看值
5. 使用 Watch 面板监视特定变量

---

## 添加调试代码

在 `assets/js/script.js` 中添加 `console.log` 输出调试信息。

### 示例 1：调试测试按钮点击事件

```javascript
testBtn.addEventListener('click', async () => {
  console.log('=== 开始测试 ===');
  console.log('API URL:', apiUrl);
  console.log('API Key:', apiKey.substring(0, 10) + '...');  // 只显示前10位
  console.log('Model:', model);
  console.log('Scenario:', scenario);
  
  // ... 原有代码
  
  console.log('Request Body:', requestBody1);
  const r1 = await fetchAndParse(endpoint, {...});
  console.log('Response:', r1);
  console.log('=== 测试结束 ===');
});
```

### 示例 2：调试配置保存

```javascript
saveConfigBtn.addEventListener('click', async () => {
  const name = configNameEl.value.trim();
  const url = stripTrailingSlash(configUrlEl.value.trim());
  const key = configKeyEl.value.trim();
  const model = (configModelEl.value || SYSTEM_DEFAULTS.model).trim();
  
  console.log('保存配置:', { name, url, key: key.substring(0, 10) + '...', model });
  
  if(!name || !url || !key){ 
    console.warn('配置不完整');
    await appAlert('请填写所有必填字段。'); 
    return; 
  }
  
  const cfgs = loadConfigs();
  console.log('当前配置列表:', cfgs);
  
  // ... 原有代码
});
```

### 示例 3：调试网络请求

```javascript
async function fetchAndParse(url, options){
  console.log('发送请求:', url);
  console.log('请求选项:', options);
  
  const res = await fetch(url, options);
  console.log('响应状态:', res.status, res.statusText);
  
  const contentType = res.headers.get('content-type') || '';
  console.log('Content-Type:', contentType);
  
  const text = await res.text();
  console.log('响应文本长度:', text.length);
  console.log('响应文本预览:', text.substring(0, 200));
  
  let json; 
  try { 
    json = JSON.parse(text); 
    console.log('JSON 解析成功:', json);
  } catch(e) {
    console.error('JSON 解析失败:', e);
  }
  
  if(!res.ok){ 
    const e = new Error(`HTTP ${res.status}`); 
    e.status = res.status; 
    e.rawText = text; 
    e.contentType = contentType; 
    console.error('请求失败:', e);
    throw e; 
  }
  
  return { json, text, contentType };
}
```

---

## 检查 LocalStorage

### 在浏览器控制台执行

#### 查看所有配置

```javascript
// 查看原始数据
localStorage.getItem('apiConfigs')

// 查看解析后的对象
JSON.parse(localStorage.getItem('apiConfigs'))

// 格式化输出
console.table(JSON.parse(localStorage.getItem('apiConfigs')))
```

#### 清空所有配置

```javascript
// 删除配置
localStorage.removeItem('apiConfigs')

// 验证删除
localStorage.getItem('apiConfigs')  // 应该返回 null
```

#### 手动添加测试配置

```javascript
// 添加单个配置
localStorage.setItem('apiConfigs', JSON.stringify([
  {
    name: "测试配置",
    url: "https://api.openai.com",
    key: "sk-test-key-123456",
    model: "gpt-4",
    isDefault: true
  }
]))

// 添加多个配置
localStorage.setItem('apiConfigs', JSON.stringify([
  {
    name: "OpenAI 生产",
    url: "https://api.openai.com",
    key: "sk-prod-key",
    model: "gpt-4",
    isDefault: true
  },
  {
    name: "OpenAI 测试",
    url: "https://api.openai.com",
    key: "sk-test-key",
    model: "gpt-3.5-turbo",
    isDefault: false
  },
  {
    name: "Gemini",
    url: "https://generativelanguage.googleapis.com",
    key: "AIza-test-key",
    model: "gemini-pro",
    isDefault: false
  }
]))
```

#### 修改现有配置

```javascript
// 读取配置
let configs = JSON.parse(localStorage.getItem('apiConfigs'))

// 修改第一个配置的模型
configs[0].model = 'gpt-4-turbo'

// 保存回去
localStorage.setItem('apiConfigs', JSON.stringify(configs))
```

---

## 测试特定场景

### 方法 1：修改默认消息（临时调试）

在 `script.js` 中找到对应场景，修改 `userText`：

```javascript
// 找到测试按钮的事件处理函数
testBtn.addEventListener('click', async () => {
  // ...
  try{
    requestPending = true; showWaiting();
    
    // 修改这里的默认值进行测试
    const userText = userInputEl.value.trim() || '你的自定义测试消息';
    
    if(scenario === 'openai_tools'){
      // ...
    }
  }
});
```

### 方法 2：使用控制台直接修改输入框

```javascript
// 设置用户消息
document.querySelector('#userInput').value = '测试消息：当前北京时间是？'

// 选择特定场景
document.querySelector('[data-scenario="gemini_search"]').click()

// 触发测试
document.querySelector('#testBtn').click()
```

### 方法 3：创建测试函数

在控制台中定义快捷测试函数：

```javascript
function quickTest(scenario, message) {
  // 选择场景
  document.querySelector(`[data-scenario="${scenario}"]`).click()
  
  // 设置消息
  document.querySelector('#userInput').value = message
  
  // 延迟执行，等待场景切换完成
  setTimeout(() => {
    document.querySelector('#testBtn').click()
  }, 100)
}

// 使用示例
quickTest('openai_tools', '当前时间是？')
quickTest('gemini_search', '搜索最新的 AI 新闻')
```

---

## 模拟 API 响应

如果 API 不可用或需要测试特定响应，可以临时修改代码模拟响应。

### 方法 1：修改 fetchAndParse 函数

在 `script.js` 中找到 `fetchAndParse` 函数，添加模拟逻辑：

```javascript
async function fetchAndParse(url, options){
  // ===== 模拟响应（调试用）=====
  const MOCK_MODE = true;  // 设置为 true 启用模拟
  
  if (MOCK_MODE) {
    console.log('🔧 模拟模式已启用');
    
    // 模拟 OpenAI 工具调用响应
    if (url.includes('chat/completions')) {
      await new Promise(resolve => setTimeout(resolve, 500));  // 模拟延迟
      return {
        json: {
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_mock_123',
                type: 'function',
                function: {
                  name: 'get_current_time',
                  arguments: '{}'
                }
              }]
            }
          }]
        },
        text: '{"choices":[...]}',
        contentType: 'application/json'
      };
    }
    
    // 模拟 Gemini 响应
    if (url.includes('generateContent')) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        json: {
          candidates: [{
            content: {
              role: 'model',
              parts: [{
                functionCall: {
                  name: 'get_current_time',
                  args: {}
                }
              }]
            }
          }]
        },
        text: '{"candidates":[...]}',
        contentType: 'application/json'
      };
    }
  }
  // ===== 模拟响应结束 =====
  
  // 原有代码
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch{}
  if(!res.ok){ 
    const e = new Error(`HTTP ${res.status}`); 
    e.status = res.status; 
    e.rawText = text; 
    e.contentType = contentType; 
    throw e; 
  }
  return { json, text, contentType };
}
```

### 方法 2：使用浏览器扩展拦截请求

推荐使用 **Requestly** 或 **ModHeader** 等浏览器扩展：

1. 安装扩展
2. 创建规则拦截特定 URL
3. 返回自定义 JSON 响应

---

## 常见问题排查

### 问题 1：CORS 错误

**错误信息**：
```
Access to fetch at 'https://api.openai.com/v1/chat/completions' from origin 'file://' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

**原因**：
- 直接打开 HTML 文件（`file://` 协议）
- API 服务器不支持跨域请求

**解决方案**：

1. **使用本地服务器**（推荐）：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx http-server -p 8000
   
   # PHP
   php -S localhost:8000
   ```
   然后访问 `http://localhost:8000`

2. **使用代理服务器**：
   - 使用 New API 等代理服务
   - 配置 Nginx 反向代理

3. **临时禁用浏览器安全策略**（仅用于开发）：
   ```bash
   # Chrome (不推荐，仅用于测试)
   chrome --disable-web-security --user-data-dir=/tmp/chrome-dev
   ```

### 问题 2：401 Unauthorized

**错误信息**：
```
HTTP 401
{"error": {"message": "Incorrect API key provided", "type": "invalid_request_error"}}
```

**排查步骤**：

1. **检查 API Key 是否正确**：
   ```javascript
   // 在控制台查看
   document.querySelector('#apiKey').value
   ```

2. **检查请求头**：
   - 打开 Network 标签
   - 点击失败的请求
   - 查看 Headers → Request Headers
   - 确认 `Authorization: Bearer sk-xxx` 是否正确

3. **检查 API Key 权限**：
   - 登录 API 提供商控制台
   - 检查 API Key 是否有效
   - 检查是否有调用权限

4. **检查 API Key 格式**：
   ```javascript
   // OpenAI: sk-开头
   // Anthropic: sk-ant-开头
   // Gemini: AIza 开头
   ```

### 问题 3：返回 HTML 而不是 JSON

**错误信息**：
```
响应非 JSON
检测到返回的是网页，您可能填写了错误的 API URL。
```

**排查步骤**：

1. **检查 API URL**：
   ```javascript
   // 正确格式（不要包含路径）
   https://api.openai.com
   
   // 错误格式
   https://api.openai.com/v1/chat/completions  // ❌ 不要包含路径
   https://platform.openai.com                 // ❌ 这是网页地址
   ```

2. **查看实际请求 URL**：
   - 打开 Network 标签
   - 查看请求的完整 URL
   - 确认是否被重定向

3. **检查响应内容**：
   - 点击请求 → Response 标签
   - 查看是否是 HTML 登录页面

### 问题 4：未触发工具调用

**现象**：
- 显示黄色提示："未触发工具调用：模型可能未理解指令，或 API 异常。"
- 响应中没有 `tool_calls` / `tool_use` / `functionCall`

**调试代码**：

```javascript
// 在响应处理后添加
console.log('=== 响应分析 ===');
console.log('完整响应:', data1);
console.log('Choices:', data1.choices);
console.log('第一个 Choice:', data1.choices?.[0]);
console.log('Message:', data1.choices?.[0]?.message);
console.log('Tool calls:', data1.choices?.[0]?.message?.tool_calls);
console.log('Content:', data1.choices?.[0]?.message?.content);
```

**可能原因**：

1. **模型不支持工具调用**：
   - 使用支持的模型：`gpt-4`, `gpt-3.5-turbo`, `claude-3-opus`, `gemini-pro`
   - 避免使用旧版本模型

2. **用户消息不够明确**：
   ```javascript
   // 不明确
   "你好"
   
   // 明确（会触发工具调用）
   "当前时间是？"
   "现在几点了？"
   "告诉我现在的日期和时间"
   ```

3. **API 配置错误**：
   - 检查 API URL 是否正确
   - 检查模型名称是否正确

4. **工具定义问题**：
   - 检查 `tools` 参数是否正确传递
   - 查看 Network 标签中的请求体

### 问题 5：请求超时

**错误信息**：
```
Failed to fetch
net::ERR_CONNECTION_TIMED_OUT
```

**排查步骤**：

1. **检查网络连接**：
   ```bash
   # 测试 API 是否可达
   ping api.openai.com
   curl -I https://api.openai.com
   ```

2. **检查防火墙/代理设置**

3. **增加超时时间**（修改代码）：
   ```javascript
   async function fetchAndParse(url, options){
     // 添加超时控制
     const controller = new AbortController();
     const timeout = setTimeout(() => controller.abort(), 30000);  // 30秒超时
     
     try {
       const res = await fetch(url, { 
         ...options, 
         signal: controller.signal 
       });
       clearTimeout(timeout);
       // ... 原有代码
     } catch (err) {
       clearTimeout(timeout);
       if (err.name === 'AbortError') {
         throw new Error('请求超时（30秒）');
       }
       throw err;
     }
   }
   ```

---

## 网络请求调试技巧

### 使用 cURL 测试 API

#### OpenAI API

```bash
# 基本请求
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 工具调用测试
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "当前时间是？"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_current_time",
        "description": "获取当前的日期和时间",
        "parameters": {"type": "object", "properties": {}, "required": []}
      }
    }]
  }'

# 查看完整响应头
curl -v https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hi"}]}'
```

#### Claude API

```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-opus-20240229",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "当前时间是？"}],
    "tools": [{
      "name": "get_current_time",
      "description": "获取当前的日期和时间",
      "input_schema": {"type": "object", "properties": {}, "required": []}
    }]
  }'
```

#### Gemini API

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"role": "user", "parts": [{"text": "当前时间是？"}]}],
    "tools": [{
      "functionDeclarations": [{
        "name": "get_current_time",
        "description": "获取当前的日期和时间",
        "parameters": {"type": "object", "properties": {}, "required": []}
      }]
    }]
  }'
```

### 从浏览器复制为 cURL

1. 打开 Network 标签
2. 右键点击请求
3. 选择 **Copy** → **Copy as cURL**
4. 粘贴到终端执行

### 使用 Postman 测试

1. 导入 cURL 命令（File → Import → Raw text）
2. 修改参数进行测试
3. 查看响应和响应头

---

## 性能调试

### 查看页面加载性能

```javascript
// 在控制台执行
performance.getEntriesByType('navigation')[0]

// 查看关键指标
const nav = performance.getEntriesByType('navigation')[0]
console.log('DNS 查询:', nav.domainLookupEnd - nav.domainLookupStart, 'ms')
console.log('TCP 连接:', nav.connectEnd - nav.connectStart, 'ms')
console.log('请求响应:', nav.responseEnd - nav.requestStart, 'ms')
console.log('DOM 解析:', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart, 'ms')
console.log('页面加载:', nav.loadEventEnd - nav.loadEventStart, 'ms')
```

### 查看资源加载时间

```javascript
// 查看所有资源
performance.getEntriesByType('resource')

// 查看 JS 文件加载时间
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('.js'))
  .forEach(r => console.log(r.name, r.duration, 'ms'))

// 查看 CSS 文件加载时间
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('.css'))
  .forEach(r => console.log(r.name, r.duration, 'ms'))
```

### 测量函数执行时间

```javascript
// 在代码中添加性能标记
console.time('测试请求');
// ... 执行代码
console.timeEnd('测试请求');

// 或使用 Performance API
performance.mark('test-start');
// ... 执行代码
performance.mark('test-end');
performance.measure('test-duration', 'test-start', 'test-end');
console.log(performance.getEntriesByName('test-duration')[0].duration, 'ms');
```

---

## 移动端调试

### Chrome 远程调试 (Android)

1. **手机端设置**：
   - 设置 → 开发者选项 → USB 调试（开启）
   - 连接电脑

2. **电脑端操作**：
   - Chrome 访问 `chrome://inspect`
   - 等待设备出现
   - 点击 **inspect** 打开调试工具

3. **调试**：
   - 可以查看控制台、网络、元素等
   - 可以在电脑上操作手机页面

### Safari 远程调试 (iOS)

1. **iPhone 设置**：
   - 设置 → Safari → 高级 → 网页检查器（开启）
   - 连接 Mac

2. **Mac 操作**：
   - Safari → 开发 → 选择设备和页面
   - 打开 Web 检查器

### 使用 Eruda 移动端调试工具

在 `index.html` 的 `<head>` 中添加：

```html
<!-- 移动端调试工具（仅开发环境） -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

刷新页面后，右下角会出现调试按钮，点击可查看：
- Console
- Elements
- Network
- Resources
- Info

**注意**：生产环境请移除此代码。

---

## 快速调试脚本

在浏览器控制台粘贴以下代码，创建调试助手：

```javascript
// ===== 调试助手 =====
window.debug = {
  // 查看当前配置
  getConfigs: () => {
    const configs = JSON.parse(localStorage.getItem('apiConfigs') || '[]');
    console.table(configs);
    return configs;
  },
  
  // 清空配置
  clearConfigs: () => {
    localStorage.removeItem('apiConfigs');
    console.log('✅ 配置已清空');
    location.reload();
  },
  
  // 查看当前表单值
  getFormValues: () => {
    const values = {
      apiUrl: document.querySelector('#apiUrl').value,
      apiKey: document.querySelector('#apiKey').value,
      model: document.querySelector('#model').value,
      scenario: document.querySelector('.seg-btn.active')?.dataset.scenario,
      userInput: document.querySelector('#userInput').value
    };
    console.table(values);
    return values;
  },
  
  // 设置表单值
  setFormValues: (apiUrl, apiKey, model) => {
    if (apiUrl) document.querySelector('#apiUrl').value = apiUrl;
    if (apiKey) document.querySelector('#apiKey').value = apiKey;
    if (model) document.querySelector('#model').value = model;
    console.log('✅ 表单值已设置');
  },
  
  // 切换场景
  setScenario: (scenario) => {
    const btn = document.querySelector(`[data-scenario="${scenario}"]`);
    if (btn) {
      btn.click();
      console.log('✅ 已切换到场景:', scenario);
    } else {
      console.error('❌ 场景不存在:', scenario);
      console.log('可用场景:', ['openai_tools', 'anthropic_tools', 'gemini_tools', 'gemini_search', 'gemini_url_context']);
    }
  },
  
  // 设置用户消息
  setMessage: (message) => {
    document.querySelector('#userInput').value = message;
    console.log('✅ 用户消息已设置:', message);
  },
  
  // 模拟点击测试按钮
  test: () => {
    document.querySelector('#testBtn').click();
    console.log('🚀 测试已触发');
  },
  
  // 清空结果
  clear: () => {
    document.querySelector('#clearBtn').click();
    console.log('✅ 结果已清空');
  },
  
  // 快速测试（组合操作）
  quickTest: (scenario, message) => {
    debug.setScenario(scenario);
    debug.setMessage(message);
    setTimeout(() => debug.test(), 200);
  },
  
  // 添加测试配置
  addTestConfig: () => {
    const configs = JSON.parse(localStorage.getItem('apiConfigs') || '[]');
    configs.push({
      name: "测试配置 " + (configs.length + 1),
      url: "https://api.openai.com",
      key: "sk-test-" + Date.now(),
      model: "gpt-4",
      isDefault: configs.length === 0
    });
    localStorage.setItem('apiConfigs', JSON.stringify(configs));
    console.log('✅ 测试配置已添加');
    location.reload();
  },
  
  // 查看 LocalStorage 所有数据
  viewStorage: () => {
    const storage = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      storage[key] = localStorage.getItem(key);
    }
    console.table(storage);
    return storage;
  },
  
  // 导出配置
  exportConfigs: () => {
    const configs = localStorage.getItem('apiConfigs');
    const blob = new Blob([configs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-configs-' + Date.now() + '.json';
    a.click();
    console.log('✅ 配置已导出');
  },
  
  // 导入配置（需要手动粘贴 JSON）
  importConfigs: (jsonString) => {
    try {
      const configs = JSON.parse(jsonString);
      localStorage.setItem('apiConfigs', JSON.stringify(configs));
      console.log('✅ 配置已导入');
      location.reload();
    } catch (e) {
      console.error('❌ 导入失败:', e);
    }
  },
  
  // 显示帮助
  help: () => {
    console.log(`
📚 调试助手使用说明：

🔍 查看信息：
  debug.getConfigs()        - 查看所有配置
  debug.getFormValues()     - 查看当前表单值
  debug.viewStorage()       - 查看所有 LocalStorage 数据

⚙️ 设置：
  debug.setFormValues(url, key, model)  - 设置表单值
  debug.setScenario('openai_tools')     - 切换场景
  debug.setMessage('你的消息')           - 设置用户消息

🧪 测试：
  debug.test()                          - 触发测试
  debug.clear()                         - 清空结果
  debug.quickTest('gemini_search', '搜索AI新闻')  - 快速测试

💾 配置管理：
  debug.addTestConfig()     - 添加测试配置
  debug.clearConfigs()      - 清空所有配置
  debug.exportConfigs()     - 导出配置到文件
  debug.importConfigs(json) - 导入配置（传入 JSON 字符串）

📖 帮助：
  debug.help()              - 显示此帮助信息
    `);
  }
};

console.log('🎉 调试助手已加载！输入 debug.help() 查看使用说明');
```

### 使用示例

```javascript
// 查看当前配置
debug.getConfigs()

// 查看表单值
debug.getFormValues()

// 设置表单
debug.setFormValues('https://api.openai.com', 'sk-test-123', 'gpt-4')

// 快速测试
debug.quickTest('openai_tools', '当前时间是？')

// 切换场景
debug.setScenario('gemini_search')

// 清空结果
debug.clear()

// 添加测试配置
debug.addTestConfig()

// 导出配置
debug.exportConfigs()

// 查看帮助
debug.help()
```

---

## 调试检查清单

遇到问题时，按以下顺序检查：

### ✅ 基础检查

- [ ] 是否使用本地服务器运行（不是 `file://` 协议）
- [ ] 浏览器控制台是否有错误信息
- [ ] Network 标签中请求状态码是多少
- [ ] API URL 是否正确（不包含路径）
- [ ] API Key 是否正确且有效
- [ ] 模型名称是否正确

### ✅ 网络检查

- [ ] 网络连接是否正常
- [ ] 是否有 CORS 错误
- [ ] 请求头是否正确（Authorization, Content-Type）
- [ ] 请求体格式是否正确（JSON）
- [ ] 响应 Content-Type 是否为 `application/json`

### ✅ 配置检查

- [ ] LocalStorage 中是否有配置数据
- [ ] 配置格式是否正确
- [ ] 默认配置是否正确应用

### ✅ 代码检查

- [ ] JavaScript 是否有语法错误
- [ ] 是否有未捕获的异常
- [ ] 异步操作是否正确处理（async/await）
- [ ] 事件监听器是否正确绑定

---

## 获取帮助

如果以上方法都无法解决问题：

1. **查看浏览器控制台完整错误信息**
2. **查看 Network 标签中的请求和响应详情**
3. **使用 cURL 测试 API 是否正常**
4. **在 GitHub 提交 Issue**，包含：
   - 错误信息截图
   - 浏览器和版本
   - 复现步骤
   - Network 标签截图

---

**最后更新**：2025-10-21
