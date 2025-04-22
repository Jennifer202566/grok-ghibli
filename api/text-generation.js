// api/text-generation.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // 使用一个简单的文本生成模型
    const modelId = "meta/llama-2-7b-chat:13c3cdee13ee059ab779f0291d29054dab00a47dad8261375654de5540165fb0";
    
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelId,
        input: {
          prompt: "Write a short poem about Studio Ghibli movies."
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
        throw new Error(`文本生成失败: ${prediction.error}`);
      }
      
      if (prediction.status !== 'succeeded') {
        // 等待一秒后再次轮询
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    // 返回生成的文本
    return res.status(200).json({ 
      output: prediction.output,
      prompt: "Write a short poem about Studio Ghibli movies."
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
