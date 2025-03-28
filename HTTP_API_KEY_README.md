# Cline HTTP API密钥自动获取功能

本功能允许Cline扩展在启动时自动从HTTP接口获取API密钥，无需用户手动输入。这对于团队或企业部署特别有用，可以集中管理API密钥。

## 功能特点

- 首次启动时自动从HTTP接口获取API密钥
- 支持多种API提供商：OpenRouter、Anthropic、OpenAI等
- 支持通过环境变量`CLINE_TYPE`指定不同的配置类型
- 当已有API密钥时不会重复获取

## 配置方法

### 基本使用

Cline扩展默认会尝试从`http://localhost:3000/api/defaultApiKey`获取API密钥。您只需要确保该接口可用即可。

如果需要自定义API接口URL，可以在VSCode设置中配置：

```json
{
  "cline.apiKeyEndpoint": "http://your-api-server.com/api/defaultApiKey"
}
```

### 环境变量

您可以通过设置环境变量`CLINE_TYPE`来指定不同的配置类型，Cline扩展会自动将其作为查询参数传递给API接口：

```
CLINE_TYPE=enterprise
```

这将使得Cline发送请求到：`http://localhost:3000/api/defaultApiKey?cline_type=enterprise`

### API响应格式

API服务器需要返回包含以下字段的JSON对象：

```json
{
  "apiKey": "your-api-key-here",
  "apiProvider": "openrouter",
  "modelId": "anthropic/claude-3-opus-20240229"
}
```

字段说明：

- `apiKey`: API密钥（必填）
- `apiProvider`: API提供商，可选值：`openrouter`, `anthropic`, `openai`, `cline`（可选，默认为openrouter）
- `modelId`: 模型ID（可选）

## 示例API服务器

项目中提供了一个示例API服务器脚本`example-api-server.js`，可用于测试此功能：

```javascript
app.get('/api/defaultApiKey', (req, res) => {
    // 获取cline_type参数
    const clineType = req.query.cline_type || 'default';
    
    // 根据不同的cline_type返回不同的配置
    switch(clineType) {
        case 'enterprise':
            res.json({
                apiKey: 'sk-enterprise-api-key',
                apiProvider: 'anthropic',
                modelId: 'claude-3-opus-20240229'
            });
            break;
        // ... 其他配置类型 ...
        default:
            res.json({
                apiKey: 'sk-or-your-openrouter-api-key-here',
                apiProvider: 'openrouter',
                modelId: 'anthropic/claude-3-opus-20240229'
            });
    }
});
```

启动示例服务器：

```bash
# 安装依赖
npm install express cors

# 运行服务器
node example-api-server.js
```

## 安全建议

在生产环境中使用此功能时，请注意以下安全事项：

1. 使用HTTPS加密传输API密钥
2. 添加身份验证和授权机制，确保只有授权用户可以获取API密钥
3. 在API服务器上实现请求限制和日志记录
4. 考虑使用临时API密钥或限制密钥的权限范围
5. 定期轮换API密钥

## 故障排除

如果遇到问题，请检查：

1. API接口URL是否正确
2. 网络连接是否正常
3. API服务器是否返回正确的响应格式
4. VSCode错误日志中的相关错误信息
5. 环境变量`CLINE_TYPE`是否正确设置

## 完全自动化部署

对于团队或企业部署，建议：

1. 搭建集中式API密钥管理服务器
2. 根据不同用户角色或团队提供不同的API密钥和模型配置
3. 通过环境变量`CLINE_TYPE`来区分不同的用户组或使用场景
4. 实现API密钥的自动轮换和权限管理 
