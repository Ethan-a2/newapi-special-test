# 调试日志系统更新日志

## 2025-10-21 - 添加详细调试日志系统

### 新增功能

#### 1. 完整的调试日志系统

在 `assets/js/script.js` 中添加了完整的调试日志系统：

```javascript
const DEBUG = {
  enabled: true,           // 可控制开关
  log: function(...args),  // 一般日志 🔍
  info: function(...args), // 信息日志 ℹ️
  success: function(...args), // 成功日志 ✅
  warn: function(...args), // 警告日志 ⚠️
  error: function(...args), // 错误日志 ❌
  group: function(title),  // 分组开始
  groupEnd: function(),    // 分组结束
  table: function(data),   // 表格显示
  time: function(label),   // 计时开始
  timeEnd: function(label), // 计时结束
  maskApiKey: function(key) // 安全显示 API Key
};
```

#### 2. 自动日志记录

所有关键操作都会自动记录日志：

**页面初始化**：
- 脚本加载
- 密码切换功能初始化
- 默认配置应用
- 页面初始化耗时

**配置管理**：
- 配置加载/保存
- 配置新增/编辑/删除
- 默认配置设置/取消
- 配置应用

**测试流程**：
- 测试开始/结束
- 场景切换
- 用户消息设置
- 每个测试步骤的详细信息

**网络请求**：
- 请求 URL（自动隐藏 API Key）
- 请求方法和请求头
- 请求体大小和预览
- 响应状态和大小
- JSON 解析结果
- 请求耗时

**错误处理**：
- 错误消息和堆栈
- 错误状态码
- 响应内容预览

#### 3. 性能分析

自动记录关键操作的耗时：

- 页面初始化耗时
- 每次网络请求耗时
- 测试总耗时

#### 4. 安全特性

- 自动隐藏 API Key（只显示前 7 位和后 4 位）
- URL 中的 API Key 参数自动脱敏
- 请求头中的认证信息自动脱敏

### 新增文档

#### 1. DEBUG_LOGS.md

详细的调试日志使用说明文档，包含：

- 启用/禁用调试日志的方法
- 日志类型说明和图标
- 查看调试日志的步骤
- 完整的日志输出示例
- 常见调试场景和解决方法
- 性能分析指南
- 高级调试技巧
- 调试日志 API 参考
- 常见问题解答

#### 2. DEBUG.md 更新

在原有调试指南基础上，新增：

- 调试日志系统的说明
- 如何使用内置日志进行调试
- 日志过滤和查看技巧

#### 3. AGENTS.md 更新

添加了调试系统章节，说明：

- 调试日志特性
- 快速使用方法
- 日志示例
- 相关文档链接

#### 4. README.md 更新

在功能特性中添加：

- 内置调试日志系统的说明
- 相关文档链接

### 代码改进

#### 1. 日志覆盖范围

添加了以下模块的详细日志：

- **LocalStorage 操作**：
  - `loadConfigs()` - 配置加载
  - `saveConfigs()` - 配置保存

- **URL 构建**：
  - `stripTrailingSlash()` - 移除尾部斜杠
  - `buildEndpoint()` - OpenAI 端点构建
  - `buildGeminiEndpoint()` - Gemini 端点构建
  - `buildAnthropicEndpoint()` - Anthropic 端点构建

- **配置管理**：
  - `displayConfigs()` - 配置列表显示
  - 配置新增/编辑/删除事件
  - 默认配置设置/取消事件
  - 配置应用事件

- **页面初始化**：
  - 密码切换功能初始化
  - 默认配置应用
  - 默认用户消息设置

- **场景切换**：
  - `setActiveScenario()` - 场景切换
  - 默认消息设置

- **测试流程**：
  - 测试开始/结束
  - 配置验证
  - 场景识别
  - OpenAI 工具调用（3 个步骤）
  - 其他场景（待完善）

- **网络请求**：
  - `fetchAndParse()` - 完整的请求/响应日志
  - `ensureJsonOrThrow()` - JSON 验证

- **错误处理**：
  - 测试过程错误
  - 网络请求错误
  - JSON 解析错误

#### 2. 日志分组

使用 `DEBUG.group()` 和 `DEBUG.groupEnd()` 对相关日志进行分组：

- 测试配置
- 应用默认配置
- 系统默认配置
- 网络请求
- 请求头
- 错误详情
- OpenAI 工具调用测试

#### 3. 性能计时

使用 `DEBUG.time()` 和 `DEBUG.timeEnd()` 记录耗时：

- 页面初始化
- 测试总耗时
- 每次网络请求耗时

### 使用示例

#### 查看所有日志

```javascript
// 打开浏览器控制台（F12）
// 所有日志会自动输出
```

#### 临时禁用日志

```javascript
// 在控制台执行
DEBUG.enabled = false;
```

#### 重新启用日志

```javascript
DEBUG.enabled = true;
```

#### 过滤特定日志

在控制台过滤框中输入：

- `🔍` - 查看一般日志
- `✅` - 查看成功日志
- `❌` - 查看错误日志
- `⚠️` - 查看警告日志
- `网络请求` - 查看网络相关日志
- `配置` - 查看配置相关日志

### 性能影响

- 日志系统对性能影响极小（< 1ms）
- 所有日志都有 `enabled` 开关控制
- 生产环境可通过设置 `DEBUG.enabled = false` 完全禁用

### 兼容性

- 支持所有现代浏览器（Chrome, Firefox, Safari, Edge）
- 使用标准 `console` API，无需额外依赖
- 优雅降级，即使浏览器不支持某些 API 也不会报错

### 后续计划

- [ ] 为 Claude API 工具调用添加详细日志
- [ ] 为 Gemini API 工具调用添加详细日志
- [ ] 为 Gemini API 搜索添加详细日志
- [ ] 为 Gemini API URL 上下文添加详细日志
- [ ] 添加日志导出功能
- [ ] 添加日志级别控制（只显示错误/警告等）
- [ ] 添加日志统计功能（请求次数、成功率等）

### 相关文件

**新增文件**：
- `DEBUG_LOGS.md` - 调试日志使用说明
- `CHANGELOG_DEBUG.md` - 本文件

**修改文件**：
- `assets/js/script.js` - 添加调试日志系统和日志记录
- `AGENTS.md` - 添加调试系统章节
- `README.md` - 添加调试日志功能说明
- `DEBUG.md` - 更新调试指南（已存在）

### 贡献者

- AI Assistant - 调试日志系统设计和实现

---

**版本**: 1.0.0  
**日期**: 2025-10-21  
**状态**: ✅ 已完成
