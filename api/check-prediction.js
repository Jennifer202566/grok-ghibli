// api/check-prediction.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // 获取预测 ID
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: '缺少预测 ID' });
    }
    
    console.log('检查预测结果:', id);
    
    // 获取 API 密钥
    const apiKey = process.env.REPLICATE_API_TOKEN;
    
    // 调用 Replicate API
    const response = await axios.get(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: {
          'Authorization': `Token ${apiKey}`
        },
        timeout: 5000 // 5 秒超时
      }
    );
    
    console.log('预测状态:', response.data.status);
    
    // 返回预测结果
    return res.status(200).json({
      prediction: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('检查预测错误:', error.message);
    
    // 详细记录错误
    let errorDetails = {
      message: error.message
    };
    
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
    }
    
    return res.status(500).json({
      error: error.message,
      details: errorDetails
    });
  }
};
