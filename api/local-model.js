// api/local-model.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    console.log('开始本地模型测试');
    
    // 获取 API 密钥
    const apiKey = process.env.REPLICATE_API_TOKEN;
    console.log('API 密钥前缀:', apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : 'not set');
    
    // 使用您在本地成功使用的模型 ID 和参数
    // 注意：请替换为您实际使用的模型 ID 和参数
    const modelId = "cjwbw/ghibli-diffusion:3f0d3f9c7a5d5fa8e1db9edaaad0fe43a0f770d8226111a9b682d2cdb70c3d1f";
    const inputParams = {
      prompt: "A landscape in the style of Studio Ghibli"
    };
    
    console.log('使用模型:', modelId);
    console.log('使用参数:', JSON.stringify(inputParams));
    
    // 调用 Replicate API
    console.log('调用 Replicate API');
    
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelId,
        input: inputParams
      },
      {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 秒超时
      }
    );
    
    console.log('API 调用成功，状态码:', response.status);
    console.log('预测 ID:', response.data.id);
    
    // 获取预测 ID
    const predictionId = response.data.id;
    
    // 返回预测 ID，不等待结果
    return res.status(200).json({
      success: true,
      message: '模型调用已提交',
      predictionId: predictionId,
      checkUrl: `https://api.replicate.com/v1/predictions/${predictionId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('本地模型测试错误:', error.message);
    
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
