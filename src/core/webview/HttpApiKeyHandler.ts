import * as vscode from 'vscode';
import axios from 'axios';
import { ClineProvider } from './ClineProvider';
import { ApiProvider } from '../../shared/api';

// 默认API接口URL
const DEFAULT_API_ENDPOINT = 'http://localhost:3000/api/defaultApiKey';

/**
 * 从HTTP接口获取API密钥的处理器
 */
export async function fetchApiKeyFromHttp(
    provider: ClineProvider
): Promise<boolean> {
    try {
        // 先尝试从环境变量获取API接口URL
        let apiUrl = process.env.API_KEY_ENDPOINT;
        
        // 如果环境变量中没有，则从配置中获取
        if (!apiUrl) {
            const config = vscode.workspace.getConfiguration("cline");
            apiUrl = config.get<string>("apiKeyEndpoint");
        }
        
        // 如果环境变量和配置中都没有，则使用默认URL
        apiUrl = apiUrl || DEFAULT_API_ENDPOINT;
        
        // 获取环境变量中的cline_type值
        let clineType: string | undefined;
        try {
            if (process.env.CLINE_TYPE) {
                clineType = process.env.CLINE_TYPE;
            }
        } catch (error) {
            console.log("无法获取环境变量 CLINE_TYPE:", error);
        }
        
        // 构建URL，添加cline_type参数
        const requestUrl = clineType 
            ? `${apiUrl}?cline_type=${encodeURIComponent(clineType)}`
            : apiUrl;
        
        // 发送HTTP请求获取API密钥
        const response = await axios.get(requestUrl, {
            timeout: 5000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        // 提取API密钥和配置
        if (!response.data || typeof response.data !== 'object') {
            console.error("API响应格式无效，期望JSON对象:", response.data);
            return false;
        }
        
        const apiKey = response.data.apiKey;
        let apiProvider: ApiProvider = response.data.apiProvider || 'openrouter';
        const modelId = response.data.modelId;
        const customerInstruction = response.data.customerInstruction;
        
        // 如果没有找到API密钥，返回失败
        if (!apiKey) {
            console.error("API响应中没有apiKey字段:", response.data);
            return false;
        }
        
        // 验证API提供商是否有效
        if (!['openrouter', 'anthropic', 'openai', 'cline'].includes(apiProvider)) {
            console.warn(`未知的API提供商: ${apiProvider}, 将使用默认值 'openrouter'`);
            apiProvider = 'openrouter';
        }
        
        // 获取当前的API配置
        const { apiConfiguration } = await provider.getState();
        
        // 显示通知
        vscode.window.setStatusBarMessage(`设置 ${apiProvider} API密钥成功`, 3000);
        
        // 准备更新的配置
        const updatedConfig = {
            ...apiConfiguration,
            apiProvider,
        };
        
        // 根据不同的API提供商设置不同的配置项
        if (apiProvider === "openrouter") {
            updatedConfig.openRouterApiKey = apiKey;
            if (modelId) {
                updatedConfig.openRouterModelId = modelId;
            }
        } else if (apiProvider === "anthropic") {
            updatedConfig.apiKey = apiKey;
            if (modelId) {
                updatedConfig.apiModelId = modelId;
            }
        } else if (apiProvider === "openai") {
            updatedConfig.openAiApiKey = apiKey;
            if (modelId) {
                updatedConfig.openAiModelId = modelId;
            }
        } else if (apiProvider === "cline") {
            updatedConfig.clineApiKey = apiKey;
        }
        
        // 应用更新后的配置
        await provider.updateApiConfiguration(updatedConfig);
        
        // 如果提供了自定义指令，则更新
        if (customerInstruction) {
            await provider.updateCustomInstructions(customerInstruction);
        }
        
        // 向webview发送状态更新
        await provider.postStateToWebview();
        
        // 触发新的聊天会话
        await vscode.commands.executeCommand("cline.plusButtonClicked");
        
        return true;
    } catch (error) {
        console.error("获取API密钥失败:", error);
        // 显示错误通知
        vscode.window.showErrorMessage(`获取API密钥失败: ${error.message || '未知错误'}`);
        return false;
    }
} 
