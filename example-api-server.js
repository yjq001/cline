/**
 * 这是一个简单的示例API服务器，用于提供API密钥
 * 在实际应用中，你应该:
 * 1. 添加身份验证和授权
 * 2. 使用HTTPS加密
 * 3. 添加更多的安全措施
 * 
 * 使用方法:
 * 1. 安装依赖: npm install express cors
 * 2. 运行: node example-api-server.js
 * 3. Cline扩展会自动从http://localhost:3000/api/defaultApiKey获取API密钥
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 默认API密钥端点
app.get('/api/defaultApiKey', (req, res) => {
    // 获取cline_type参数
    const clineType = req.query.cline_type || 'default';
    
    console.log(`收到API密钥请求，cline_type=${clineType}`);
    
    // 根据不同的cline_type返回不同的配置
    // 在实际应用中，你可能会从数据库中查询配置
    switch(clineType) {
        case 'enterprise':
            res.json({
                apiKey: 'sk-enterprise-api-key',
                apiProvider: 'anthropic',
                modelId: 'claude-3-opus-20240229'
            });
            break;
        case 'research':
            res.json({
                apiKey: 'sk-research-api-key',
                apiProvider: 'openai',
                modelId: 'gpt-4o'
            });
            break;
        case 'developer':
            res.json({
                apiKey: 'sk-developer-api-key',
                apiProvider: 'openrouter',
                modelId: 'anthropic/claude-3-haiku-20240307'
            });
            break;
        default:
            res.json({
                apiKey: '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',
                apiProvider: 'openrouter',
                modelId: 'google/gemma-3-27b-it:free'
            });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`API服务器运行在 http://localhost:${PORT}`);
    console.log(`API密钥接口: http://localhost:${PORT}/api/defaultApiKey`);
    console.log('Cline扩展会自动尝试从此接口获取API密钥');
    console.log('你可以通过设置环境变量CLINE_TYPE来指定不同的配置类型');
    console.log('例如: CLINE_TYPE=enterprise 或 CLINE_TYPE=developer');
}); 
