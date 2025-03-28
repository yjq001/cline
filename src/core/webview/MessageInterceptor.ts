import * as vscode from "vscode"
import axios from "axios"
import * as os from "os"

/**
 * 检查消息内容是否允许发送
 * @param messageContent 消息内容
 * @param messageType 消息类型（例如：newTask, messageResponse）
 * @param additionalContext 额外上下文信息
 * @returns {Promise<boolean>} 如果允许发送返回true，否则返回false
 */
export async function checkMessageContent(
  messageContent: string, 
  messageType: string = 'unknown',
  additionalContext: any = {}
): Promise<boolean> {
  // 从环境变量或配置获取拦截服务地址
  const configuration = vscode.workspace.getConfiguration('cline');
  const interceptEndpoint = process.env.CLINE_INTERCEPT_ENDPOINT || configuration.get('apiInterceptEndpoint');
  
  // 如果未配置拦截服务，允许消息通过
  if (!interceptEndpoint) {
    console.log('未配置消息拦截服务，消息将直接发送');
    return true;
  }
  
  try {
    const hostname = os.hostname();
    const username = os.userInfo().username;
    
    // 准备请求体
    const requestBody = {
      content: messageContent,
      messageType,
      directoryName: vscode.workspace.name,
      timestamp: new Date().toISOString(),
      hostname,
      username,
      ...additionalContext
    };
    
    console.log(`发送拦截请求至 ${interceptEndpoint}`, { messageType, contentLength: messageContent.length });
    
    // 发送拦截请求
    const response = await axios.post(interceptEndpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000,
      validateStatus: (status) => status === 200 // 只有200状态码才被视为成功
    });
    
    console.log('拦截服务响应:', response.status, response.headers, response.data);
    
    // 如果响应成功并且结果为true，则允许消息通过
    if (response.status === 200 && response.data.success) {
      console.log('拦截服务允许消息通过');
      return true;
    } else {
      // 即使返回200但success为false也拦截
      const message = response.data.errmsg || '消息被拦截服务拒绝';
      vscode.window.showErrorMessage(`消息被拦截: ${message}，请修改后重试`);
      console.error('消息被拦截:', message);
      return false;
    }
  } catch (error) {
    // 检查是否为403错误（拒绝访问）
    if (error.response && error.response.status === 403) {
      const message = error.response.data?.errmsg || '消息被拦截服务拒绝';
      vscode.window.showErrorMessage(`消息被拦截: ${message}，请修改后重试`);
      console.error('消息被拦截 (403):', message, error.response.headers, error.response.data);
      return false;
    }
    
    // 如果是其他错误（例如连接失败），记录错误但允许消息通过
    console.error('拦截服务请求失败，消息将继续发送:', error.message);
    if (error.response) {
      console.error('服务器响应:', error.response.status, error.response.headers, error.response.data);
    }
    return true;
  }
} 
