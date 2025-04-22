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
    console.log('收到图像转换请求');
    
    const { image } = req.body;
    
    if (!image) {
      console.log('请求中缺少图像数据');
      return res.status(400).json({ error: '缺少图像数据' });
    }

    console.log('准备调用 Replicate API');
    
    // 使用一个已知稳定的模型 - 图像超分辨率模型
    const modelId = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";
    
    // 简化请求格式
    const requestData = {
      version: modelId,
      input: { image: `data:image/jpeg;base64,${image}` }
    };
    
    console.log('请求模型:', modelId);
    
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      requestData,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Replicate API 响应成功，预测 ID:', response.data.id);
    
    // 获取预测ID
    const predictionId = response.data.id;
    
    // 轮询获取结果
    let prediction;
    let attempts = 0;
    const maxAttempts = 60;
    
    console.log('开始轮询结果');
    
    while (!prediction || prediction.status !== 'succeeded') {
      if (attempts >= maxAttempts) {
        throw new Error('处理超时');
      }
      
      if (attempts % 10 === 0) {
        console.log(`轮询尝试 ${attempts + 1}/${maxAttempts}`);
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
      
      if (attempts % 10 === 0) {
        console.log('轮询状态:', prediction.status);
      }
      
      if (prediction.status === 'failed') {
        console.error('预测失败:', prediction.error);
        throw new Error(`图像转换失败: ${prediction.error}`);
      }
      
      if (prediction.status !== 'succeeded') {
        // 等待一秒后再次轮询
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    console.log('处理成功，返回结果');
    
    // 检查输出格式
    let outputImage = prediction.output;
    
    // 如果输出是数组，取第一个元素
    if (Array.isArray(outputImage)) {
      outputImage = outputImage[0];
    }
    
    // 返回转换后的图像
    return res.status(200).json({ outputImage: outputImage });
    
  } catch (error) {
    console.error('错误详情:', error.message);
    
    // 详细的错误响应
    let errorMessage = error.message || '服务器错误';
    let statusCode = 500;
    
    // 如果有 API 响应错误，添加更多详情
    if (error.response) {
      console.error('API 响应错误:', {
        status: error.response.status,
        data: JSON.stringify(error.response.data).substring(0, 200) + '...'
      });
      
      if (error.response.status === 422) {
        errorMessage = '请求参数无效，请尝试上传不同的图片或减小图片大小';
        statusCode = 400;
      }
    }
    
    return res.status(statusCode).json({ error: errorMessage });
  }
};
