const http = require('http');
const url = require('url');

// 从环境变量读取端口，如果没有设置则使用默认值3000
const PORT = process.env.CLINE_INTERCEPT_PORT || 3000;

// 从环境变量读取屏蔽词列表，如果没有设置则使用默认列表
const DEFAULT_BLOCKED_WORDS = [
  'hack', 'crack', 'exploit', 'illegal', 'password', 'confidential', 'private'
];

// 从环境变量读取屏蔽词，格式为逗号分隔的字符串
const envBlockedWords = process.env.CLINE_BLOCKED_WORDS 
  ? process.env.CLINE_BLOCKED_WORDS.split(',').map(word => word.trim()) 
  : [];

// 合并默认屏蔽词和环境变量中的屏蔽词
const BLOCKED_WORDS = [...new Set([...DEFAULT_BLOCKED_WORDS, ...envBlockedWords])];

// 从环境变量读取内容长度限制，如果没有设置则使用默认值10000
const CONTENT_LENGTH_LIMIT = parseInt(process.env.CLINE_CONTENT_LENGTH_LIMIT || '10000', 10);

// 定义拦截规则，根据这些规则判断消息是否应该被拦截
const interceptRules = {
  // 是否包含被禁止的词
  containsBlockedWords: (content) => {
    if (!content) return false;
    const lowerContent = content.toLowerCase();
    return BLOCKED_WORDS.some(word => lowerContent.includes(word));
  },
  
  // 检查内容长度是否合适
  contentTooLong: (content) => {
    return content && content.length > CONTENT_LENGTH_LIMIT;
  }
};

// 处理拦截请求
function handleInterceptRequest(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    console.log('=====================================');
    console.log('收到拦截请求:', body);
    
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (error) {
      console.error('请求体解析失败:', error.message);
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'X-Intercept-Result': 'rejected',
        'X-Intercept-Reason': 'invalid-format'
      });
      res.end(JSON.stringify({ 
        success: false, 
        errmsg: '无效的请求格式' 
      }));
      return;
    }
    
    const { content, messageType, timestamp, hostname, username } = requestData;
    
    console.log(`用户: ${username || '未知'}, 主机: ${hostname || '未知'}`);
    console.log(`消息类型: ${messageType}, 时间戳: ${timestamp}`);
    console.log(`消息内容: ${content?.substring(0, 100)}${content?.length > 100 ? '...' : ''}`);
    
    // 检查内容是否符合规则
    if (interceptRules.containsBlockedWords(content)) {
      console.log('内容包含敏感词，被拦截');
      res.writeHead(403, { 
        'Content-Type': 'application/json',
        'X-Intercept-Result': 'rejected',
        'X-Intercept-Reason': 'blocked-words'
      });
      res.end(JSON.stringify({ 
        success: false, 
        errmsg: '您的消息包含敏感词，请修改后重试' 
      }));
      console.log('拒绝请求，返回403状态码');
      return;
    }
    
    if (interceptRules.contentTooLong(content)) {
      console.log('内容过长，被拦截');
      res.writeHead(403, { 
        'Content-Type': 'application/json',
        'X-Intercept-Result': 'rejected',
        'X-Intercept-Reason': 'content-too-long'
      });
      res.end(JSON.stringify({ 
        success: false, 
        errmsg: `您的消息过长(${content.length}字符)，请缩短到${CONTENT_LENGTH_LIMIT}字符以内` 
      }));
      console.log('拒绝请求，返回403状态码');
      return;
    }
    
    // 通过所有规则检查，允许消息继续
    console.log('消息通过检查');
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'X-Intercept-Result': 'approved'
    });
    res.end(JSON.stringify({ 
      success: true 
    }));
    console.log('接受请求，返回200状态码');
    console.log('=====================================');
  });
}

// API密钥服务
function handleApiKeyRequest(req, res) {
  const apiKey = process.env.CLINE_API_KEY || 'sk-demo-api-key-12345';
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(apiKey);
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // 路由请求
  if (parsedUrl.pathname === '/api/interceptRequest' && req.method === 'POST') {
    handleInterceptRequest(req, res);
  } else if (parsedUrl.pathname === '/api/defaultApiKey' && req.method === 'GET') {
    handleApiKeyRequest(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`
=========================================================
  Cline 消息拦截服务器
=========================================================
  服务器地址: http://localhost:${PORT}
  拦截端点: http://localhost:${PORT}/api/interceptRequest
  API密钥端点: http://localhost:${PORT}/api/defaultApiKey
  
  配置信息:
  - 屏蔽词列表: ${BLOCKED_WORDS.join(', ')}
  - 内容长度限制: ${CONTENT_LENGTH_LIMIT} 字符
  
  环境变量配置:
  - CLINE_INTERCEPT_PORT: 服务器端口 (当前: ${PORT})
  - CLINE_BLOCKED_WORDS: 额外屏蔽词，逗号分隔
  - CLINE_CONTENT_LENGTH_LIMIT: 内容长度限制 (当前: ${CONTENT_LENGTH_LIMIT})
  - CLINE_API_KEY: API密钥
  - CLINE_INTERCEPT_ENDPOINT: 客户端拦截端点
  
  VS Code扩展配置:
  - cline.apiInterceptEndpoint: "http://localhost:${PORT}/api/interceptRequest"
  - 或设置环境变量 CLINE_INTERCEPT_ENDPOINT
=========================================================
`)
}); 
