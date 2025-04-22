// api/url-test.js
const axios = require('axios');

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 使用一个公共图像 URL
    const imageUrl = "https://replicate.delivery/pbxt/4kw2JSufHBsTfVm7k1XwP7Ybti8JdM7MbSOUBYRX9j876ohHB/out-0.png";
    
    // 使用一个简单的模型 - 尝试不同的模型
    const modelId = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
    
    console.log('使用模型:', modelId);
    console.log('使用图像 URL:', imageUrl);
    
    try {
      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: modelId,
          input: { image: imageUrl }
        },
        {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('API 响应成功:', response.data);
      
      // 获取预测ID
      const predictionId = response.data.id;
      
      // 轮询获取结果
      let prediction;
      let attempts = 0;
      const maxAttempts = 60;
      
      while (!prediction || prediction.status !== 'succeeded') {
        if (attempts >= maxAttempts) {
          throw new Error('处理超时');
        }
        
        const pollResponse = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
            }
          }
        );
        
        prediction = pollResponse.data;
        
        if (prediction.status === 'failed') {
          throw new Error(`图像转换失败: ${prediction.error}`);
        }
        
        if (prediction.status !== 'succeeded') {
          // 等待一秒后再次轮询
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      // 返回转换后的图像
      return res.status(200).json({ 
        outputImage: prediction.output,
        originalImage: imageUrl
      });
    } catch (apiError) {
      console.error('API 错误:', apiError.message);
      
      // 详细记录 API 错误
      if (apiError.response) {
        console.error('API 响应状态:', apiError.response.status);
        console.error('API 响应数据:', JSON.stringify(apiError.response.data));
        
        return res.status(apiError.response.status).json({
          error: apiError.message,
          details: apiError.response.data,
          status: apiError.response.status
        });
      } else {
        return res.status(500).json({
          error: apiError.message,
          type: 'network_error'
        });
      }
    }
    
  } catch (error) {
    console.error('服务器错误:', error);
    return res.status(500).json({ error: error.message });
  }
};
