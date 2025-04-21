// api/convert.js
const axios = require('axios');

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // 使用 Replicate API 进行图像转换
    // 注意：这里使用的是示例 ID，您需要替换为实际的 Ghibli 模型 ID
    const modelId = "cjwbw/ghibli-diffusion:3f0d3f9c7a5d5fa8e1db9edaaad0fe43a0f770d8226111a9b682d2cdb70c3d1f";
    
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelId,
        input: { image: `data:image/jpeg;base64,${image}` }
      },
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 获取预测ID
    const predictionId = response.data.id;
    
    // 轮询获取结果
    let prediction;
    let attempts = 0;
    const maxAttempts = 60; // 最多等待60秒
    
    while (!prediction || prediction.status !== 'succeeded') {
      if (attempts >= maxAttempts) {
        throw new Error('Processing timeout');
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
        throw new Error(`Image conversion failed: ${prediction.error}`);
      }
      
      if (prediction.status !== 'succeeded') {
        // 等待一秒后再次轮询
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    // 返回转换后的图像
    return res.status(200).json({ outputImage: prediction.output });
    
  } catch (error) {
    console.error('Error:', error);
    
    // 详细的错误响应
    const errorResponse = {
      error: error.message || 'Server error'
    };
    
    // 如果有 API 响应错误，添加更多详情
    if (error.response) {
      errorResponse.statusCode = error.response.status;
      errorResponse.apiResponse = error.response.data;
    }
    
    return res.status(500).json(errorResponse);
  }
};
