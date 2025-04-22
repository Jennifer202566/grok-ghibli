// api/debug-call.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    console.log('开始 API 调试测试');
    
    // 获取 API 密钥
    const apiKey = process.env.REPLICATE_API_TOKEN;
    console.log('API 密钥前缀:', apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : 'not set');
    
    // 使用一个简单的 API 调用
    console.log('尝试调用 Replicate API');
    
    const response = await axios.get(
      'https://api.replicate.com/v1/models',
      {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 秒超时
      }
    );
    
    console.log('API 调用成功，状态码:', response.status);
    console.log('返回模型数量:', response.data.results.length);
    
    // 返回成功结果
    return res.status(200).json({
      success: true,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : 'not set',
      modelsCount: response.data.results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API 调试错误:', error.message);
    
    // 详细记录错误
    let errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    };
    
    if (error.response) {
      console.error('API 响应错误:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data).substring(0, 200) + '...'
      });
      
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
    } else if (error.request) {
      console.error('未收到响应:', error.request);
      errorDetails.request = 'Request was made but no response was received';
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
};
