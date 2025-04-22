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

  try {
    // 手动解析请求体
    let body;
    try {
      if (req.body && typeof req.body === 'object') {
        body = req.body;
      } else if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const data = Buffer.concat(buffers).toString();
        body = data ? JSON.parse(data) : {};
      }
    } catch (e) {
      return res.status(400).json({ error: '无法解析请求体' });
    }

    const { image } = body;
    
    if (!image) {
      return res.status(400).json({ error: '缺少图像数据' });
    }

    // 使用 Ghibli 模型
    const modelId = "cjwbw/ghibli-diffusion:3f0d3f9c7a5d5fa8e1db9edaaad0fe43a0f770d8226111a9b682d2cdb70c3d1f";
    
    // 提交预测请求，但不等待结果
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelId,
        input: { 
          prompt: "Studio Ghibli style, Miyazaki anime art",
          image: `data:image/jpeg;base64,${image}`
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
    
    // 返回预测ID和检查URL
    return res.status(200).json({ 
      message: '图像转换请求已提交',
      predictionId: predictionId,
      checkUrl: `https://api.replicate.com/v1/predictions/${predictionId}`
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
