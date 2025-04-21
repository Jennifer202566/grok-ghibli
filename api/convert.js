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
    console.log('收到图像转换请求');
    
    const { image } = req.body;
    
    if (!image) {
      console.log('请求中缺少图像数据');
      return res.status(400).json({ error: '缺少图像数据' });
    }

    console.log('准备调用 Replicate API');
    
    // 使用 Replicate API 进行图像转换
    // 这里使用的是 Ghibli 风格转换模型
    const modelId = "cjwbw/ghibli-diffusion:3f0d3f9c7a5d5fa8e1db9edaaad0fe43a0f770d8226111a9b682d2cdb70c3d1f";
    
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelId,
        input: { 
          image: `data:image/jpeg;base64,${image}`,
          prompt: "Studio Ghibli style, Miyazaki anime art",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          negative_prompt: "low quality, bad anatomy, worst quality, low resolution"
        }
      },
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
    const maxAttempts = 120; // 最多等待120秒
    
    console.log('开始轮询结果');
    
    while (!prediction || prediction.status !== 'succeeded') {
      if (attempts >= maxAttempts) {
        throw new Error('处理超时，请尝试上传较小的图片或稍后再试');
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
    
    // 处理常见错误
    let errorMessage = error.message || '服务器错误';
    let statusCode = 500;
    
    // NSFW 内容检测错误
    if (errorMessage.includes('NSFW content detected')) {
      errorMessage = '检测到不适当的内容。请尝试上传不同的图片。';
      statusCode = 400;
    }
    
    // 超时错误
    else if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
      errorMessage = '图像处理超时。请尝试上传较小的图片或稍后再试。';
      statusCode = 408;
    }
    
    // API 密钥错误
    else if (errorMessage.includes('API key') || errorMessage.includes('token') || errorMessage.includes('authorization')) {
      errorMessage = 'API 授权错误。请联系网站管理员。';
      console.error('API 密钥问题:', error);
    }
    
    // 详细的错误响应
    const errorResponse = {
      error: errorMessage
    };
    
    // 如果有 API 响应错误，添加更多详情
    if (error.response) {
      console.error('API 响应错误:', {
        status: error.response.status,
        data: JSON.stringify(error.response.data).substring(0, 200) + '...'
      });
      
      errorResponse.statusCode = error.response.status;
      
      // 添加 API 响应数据的摘要
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorResponse.apiResponse = error.response.data.substring(0, 100) + '...';
        } else {
          errorResponse.apiResponse = {
            ...error.response.data,
            detail: error.response.data.detail ? 
                   (typeof error.response.data.detail === 'string' ? 
                    error.response.data.detail.substring(0, 100) + '...' : 
                    '(complex detail object)') : 
                   undefined
          };
        }
      }
    }
    
    return res.status(statusCode).json(errorResponse);
  }
};
