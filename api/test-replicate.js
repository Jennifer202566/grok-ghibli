// api/test-replicate.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // 测试 Replicate API 连接
    const response = await axios.get(
      'https://api.replicate.com/v1/models',
      {
        headers: {
          'Authorization': `Token ${apiKey}`
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Replicate API connection successful',
      apiKeyPrefix: apiKey.substring(0, 4) + '...',
      modelsCount: response.data.results.length
    });
  } catch (error) {
    console.error('Error testing Replicate API:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
};
