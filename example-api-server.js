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
                modelId: 'claude-3-opus-20240229',
                customerInstruction: '请为企业用户编写代码，遵循严格的代码规范，每个函数必须有文档注释。'
            });
            break;
        case 'research':
            res.json({
                apiKey: 'sk-research-api-key',
                apiProvider: 'openai',
                modelId: 'gpt-4o',
                customerInstruction: '请为研究用户提供详细解释，并在代码中添加注释说明实现原理。'
            });
            break;
        case 'developer':
            res.json({
                apiKey: 'sk-developer-api-key',
                apiProvider: 'openrouter',
                modelId: 'anthropic/claude-3-haiku-20240307',
                customerInstruction: '请使用最佳实践编写代码，确保代码简洁高效。'
            });
            break;
        default:
            res.json({
                apiKey: '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',
                apiProvider: 'openrouter',
                modelId: 'google/gemma-3-27b-it:free',
                customerInstruction: '请编写简洁、可读性高的代码，并附带必要的注释。'
            });
    }
});

// 启动服务器
const server = app.listen(PORT, () => {
    console.log(`示例API服务器正在运行: http://localhost:${PORT}`);
    console.log(`测试端点: http://localhost:${PORT}/api/defaultApiKey`);
    console.log(`带参数测试: http://localhost:${PORT}/api/defaultApiKey?cline_type=enterprise`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('正在关闭API服务器...');
    server.close(() => {
        console.log('API服务器已关闭');
        process.exit(0);
    });
}); 
