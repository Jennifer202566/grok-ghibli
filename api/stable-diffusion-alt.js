// api/stable-diffusion-alt.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // 使用模型列表中的一个模型
    // 选择 "gif-upscaler" 模型，这是一个简单的模型
    const modelOwner = "ghostface-ai";
    const modelName = "gif-upscaler";
    
    // 首先获取模型的最新版本
    const modelResponse = await axios.get(
      `https://api.replicate.com/v1/models/${modelOwner}/${modelName}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      }
    );
    
    // 获取最新版本 ID
    const latestVersion = modelResponse.data.latest_version.id;
    
    console.log('使用模型:', `${modelOwner}/${modelName}`);
    console.log('版本 ID:', latestVersion);
    
    // 使用获取到的版本 ID 创建预测
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: latestVersion,
        input: {
          // 使用一个公共图像 URL
          gif: "https://media.giphy.com/media/3o7TKsQ8UwUSQMd8Io/giphy.gif"
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
        throw new Error(`处理失败: ${prediction.error}`);
      }
      
      if (prediction.status !== 'succeeded') {
        // 等待一秒后再次轮询
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    // 返回处理结果
    return res.status(200).json({ 
      outputVideo: prediction.output,
      modelUsed: `${modelOwner}/${modelName}`,
      versionId: latestVersion
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
