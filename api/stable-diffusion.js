// api/stable-diffusion.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // 使用 Stable Diffusion 模型
    const modelId = "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478";
    
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelId,
        input: {
          prompt: "a photo of an astronaut riding a horse on mars"
        }
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
        throw new Error(`图像生成失败: ${prediction.error}`);
      }
      
      if (prediction.status !== 'succeeded') {
        // 等待一秒后再次轮询
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    // 返回生成的图像
    return res.status(200).json({ 
      outputImage: prediction.output[0]
    });
  } catch (error) {
    console.error('Error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.message,
        details: error.response.data
      });
    }
    
    return res.status(500).json({ error: error.message });
  }
};
