# Cline HTTP API密钥自动获取功能

本功能允许Cline扩展在启动时自动从HTTP接口获取API密钥，无需用户手动输入。这对于团队或企业部署特别有用，可以集中管理API密钥。

## 功能特点

- 首次启动时自动从HTTP接口获取API密钥
- 支持多种API提供商：OpenRouter、Anthropic、OpenAI等
- 支持通过环境变量`CLINE_TYPE`指定不同的配置类型
- 支持通过环境变量`API_KEY_ENDPOINT`指定API获取端点
- 支持自动配置Custom Instructions
- 当已有API密钥时不会重复获取

## 配置方法

### 基本使用

Cline扩展默认会尝试从`http://localhost:3000/api/defaultApiKey`获取API密钥。您只需要确保该接口可用即可。

### 自定义API接口URL

您可以通过以下方式自定义API接口URL（按优先级排序）：

1. **环境变量**：设置`API_KEY_ENDPOINT`环境变量
   ```
   API_KEY_ENDPOINT=http://your-api-server.com/api/defaultApiKey
   ```

2. **VSCode设置**：在VSCode设置中配置
   ```json
   {
     "cline.apiKeyEndpoint": "http://your-api-server.com/api/defaultApiKey"
   }
   ```

如果上述配置都不存在，则使用默认URL。

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
  "modelId": "anthropic/claude-3-opus-20240229",
  "customerInstruction": "请编写简洁、可读性高的代码，并附带必要的注释。"
}
```

字段说明：

- `apiKey`: API密钥（必填）
- `apiProvider`: API提供商，可选值：`openrouter`, `anthropic`, `openai`, `cline`（可选，默认为openrouter）
- `modelId`: 模型ID（可选）
- `customerInstruction`: 自定义指令，用于设置全局的Custom Instructions（可选）

## 示例API服务器

项目中提供了一个示例API服务器脚本`example-api-server.js`，可用于测试此功能：

```javascript
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/defaultApiKey', (req, res) => {
    const clineType = req.query.cline_type || 'default';
    
    // 根据不同的cline_type返回不同的配置
    switch(clineType) {
        case 'enterprise':
            res.json({
                apiKey: 'sk-enterprise-api-key',
                apiProvider: 'anthropic',
                modelId: 'claude-3-opus-20240229',
                customerInstruction: '请为企业用户编写代码，遵循严格的代码规范。'
            });
            break;
        default:
            res.json({
                apiKey: 'sk-default-api-key',
                apiProvider: 'openrouter',
                modelId: 'anthropic/claude-3-haiku-20240307',
                customerInstruction: '请编写简洁、可读性高的代码，并附带必要的注释。'
            });
    }
});

const server = app.listen(PORT, () => {
    console.log(`示例API服务器运行在 http://localhost:${PORT}`);
});
```

## 安全建议

在生产环境中使用HTTP API密钥获取功能时，请注意以下安全建议：

1. **使用HTTPS**：始终使用HTTPS加密通信，防止API密钥在传输过程中被窃取。
2. **添加身份验证**：在API服务器上实现身份验证机制，确保只有授权的Cline实例可以获取API密钥。
3. **限制IP访问**：配置API服务器只接受来自特定IP地址或网络的请求。
4. **实现访问日志**：记录所有API密钥请求，以便审计和检测异常活动。
5. **定期轮换密钥**：定期更新API密钥，并确保旧密钥在一段时间后失效。

## 问题排查

如果遇到API密钥获取失败的问题，请检查：

1. API服务器是否正常运行并可访问
2. 网络连接是否正常
3. API响应格式是否正确
4. 环境变量或配置是否正确设置

您可以在VSCode的输出面板中查看Cline扩展的日志，以获取更多调试信息。

## 完全自动化部署

对于团队或企业部署，建议：

1. 搭建集中式API密钥管理服务器
2. 根据不同用户角色或团队提供不同的API密钥和模型配置
3. 通过环境变量`CLINE_TYPE`来区分不同的用户组或使用场景
4. 实现API密钥的自动轮换和权限管理 
