# Cline 消息拦截功能

Cline 插件现在支持消息拦截功能，可以在消息发送前通过外部 HTTP 服务进行内容检查，确保消息符合安全和合规要求。

## 功能概述

- 在用户创建新任务或回复消息时，拦截并检查内容
- 通过可配置的 HTTP API 与外部服务交互
- 如果内容不合规，提供友好的错误消息给用户
- 如果拦截服务不可用，默认允许消息继续处理，不影响正常使用

## 配置方法

1. 在 VS Code 设置中配置 `cline.apiInterceptEndpoint`，指向您的拦截服务端点。例如：
   ```
   "cline.apiInterceptEndpoint": "http://localhost:3000/api/interceptRequest"
   ```

2. 启动拦截服务器。项目提供了一个示例服务器 `example-intercept-server.js`，可以用 Node.js 运行：
   ```
   node example-intercept-server.js
   ```

## 拦截服务器 API

拦截服务器需要实现一个简单的 HTTP API：

### 请求格式

```http
POST /api/interceptRequest HTTP/1.1
Content-Type: application/json

{
  "content": "用户的消息内容",
  "messageType": "newTask|askResponse",
  "timestamp": "2025-03-20T12:34:56.789Z",
  "directoryName": "项目目录名称"
}
```

### 响应格式

**允许消息继续**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}
```

**拒绝消息**

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "errmsg": "您的消息包含敏感词，请修改后重试"
}
```

## 示例拦截规则

项目中的示例拦截服务器实现了以下规则：

1. 检查消息是否包含被禁止的词（如 'hack'、'crack'、'exploit' 等）
2. 检查消息长度是否超过限制 (10,000 字符)

## 自定义拦截规则

您可以修改 `example-intercept-server.js` 中的 `interceptRules` 对象，添加或修改拦截规则：

```javascript
const interceptRules = {
  // 添加您自己的规则
  myCustomRule: (content) => {
    // 实现您的检查逻辑
    return false; // 返回 true 表示应该拦截，false 表示允许通过
  }
};
```

## 错误处理

如果拦截服务不可用或者请求处理过程中出现错误，Cline 插件会记录错误但允许消息继续处理，以避免影响用户正常使用。 

## 最新更新

我们对消息拦截功能进行了以下改进：

1. **增强错误处理**：当拦截服务器返回403状态码时，客户端现在会正确捕获这个错误并显示错误消息给用户。
2. **详细日志记录**：增加了详细的日志记录，包括请求和响应的完整信息，便于调试。
3. **HTTP头信息**：拦截服务器现在会在响应中包含额外的HTTP头信息（X-Intercept-Result和X-Intercept-Reason），提供更多关于拦截原因的上下文。
4. **消息显示**：当消息被拦截时，用户将看到一个错误提示，说明拦截的具体原因。

## 调试拦截功能

如果你需要调试拦截功能，可以按照以下步骤进行：

1. 在终端中运行示例拦截服务器：
   ```bash
   node example-intercept-server.js
   ```

2. 在服务器运行时，尝试发送一条包含敏感词的消息，或者一条超过长度限制的消息。

3. 检查服务器的控制台输出，应该能看到详细的请求信息和拦截原因。

4. 同时，在Cursor的开发者工具控制台中（按F12打开），你可以看到来自MessageInterceptor的日志信息，包括请求发送和响应处理的详细信息。

## 故障排除

如果拦截功能不正常工作，请检查以下几点：

1. **确认拦截服务器正在运行**：服务器应该正常启动并监听在配置的端口上。

2. **验证环境变量或配置**：确认`CLINE_INTERCEPT_ENDPOINT`环境变量或`cline.apiInterceptEndpoint`配置项已正确设置。

3. **检查日志**：查看拦截服务器和Cursor开发者控制台的日志，寻找潜在的错误信息。

4. **网络连接**：确保客户端可以访问拦截服务器，没有防火墙或网络限制阻止连接。

5. **状态码处理**：拦截服务器应返回正确的状态码（200表示允许，403表示拒绝）。 
