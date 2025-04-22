// 引入必要的模块
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 检查API令牌
const apiToken = process.env.REPLICATE_API_TOKEN;
if (!apiToken) {
  console.warn('警告: REPLICATE_API_TOKEN 未设置。请确保在.env文件中设置有效的API令牌。');
}

const app = express();
const port = 3000;

// 设置静态文件服务
app.use(express.static('./'));

// 设置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB限制
});

// 在 server.js 中
// 检查是否在 Vercel 环境中
const isVercel = process.env.VERCEL === '1';

// 只在非 Vercel 环境中创建目录
if (!isVercel) {
  // 确保必要的文件夹存在
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }
  if (!fs.existsSync('results')) {
    fs.mkdirSync('results', { recursive: true });
  }
}

// 处理图片上传和转换
app.post('/api/transform', upload.single('image'), async (req, res) => {
  console.log('收到图片上传请求');
  
  try {
    if (!req.file) {
      console.log('没有上传文件');
      return res.status(400).json({ error: '没有上传图片' });
    }

    console.log('文件已上传:', req.file.path);
    
    // 读取上传的图片
    const imagePath = req.file.path;
    
    // 将图片转换为base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
    console.log('图片已转换为base64');
    
    // 检查API令牌
    if (!apiToken) {
      console.error('错误: 缺少API令牌，无法调用Replicate API');
      return res.status(500).json({ error: 'API配置错误' });
    }
    
    console.log('调用Replicate API...');
    
    // 调用Replicate API - 修改提示词和参数
    const response = await axios.post('https://api.replicate.com/v1/predictions', {
      version: "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316", // Stable Diffusion 2.1
      input: {
        prompt: "Convert this image into Studio Ghibli anime style while preserving the person and their features. Miyazaki style character, same pose, same expression, detailed face, hand-drawn animation style, soft colors, maintain subject identity",
        negative_prompt: "3d, cgi, photorealistic, photo, deformed, distorted, disfigured, low quality, ugly, different person, different face, different pose, extra limbs, missing limbs, door, window, building, landscape without person",
        image: base64Image,
        width: 768,
        height: 768,
        num_outputs: 1,
        num_inference_steps: 30,
        guidance_scale: 9.0, // 增加引导比例
        scheduler: "DPMSolverMultistep",
        strength: 0.65 // 降低强度以保留更多原始特征
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiToken}`
      },
      timeout: 30000 // 30秒超时
    });

    // Replicate API是异步的，需要轮询获取结果
    let prediction = response.data;
    console.log('预测已开始:', prediction.id);

    // 轮询获取结果
    let attempts = 0;
    const maxAttempts = 120; // 最多等待120次，每次1秒
    
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < maxAttempts) {
      console.log(`预测状态 (${attempts + 1}/${maxAttempts}):`, prediction.status);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const statusResponse = await axios.get(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${apiToken}`
          },
          timeout: 10000
        });
        prediction = statusResponse.data;
      } catch (pollError) {
        console.error('轮询状态时出错:', pollError.message);
        // 继续尝试，不中断循环
      }
      
      attempts++;
    }

    if (prediction.status === "failed") {
      console.error('预测失败:', prediction.error);
      throw new Error(`图像转换失败: ${prediction.error || '未知错误'}`);
    }
    
    if (attempts >= maxAttempts && prediction.status !== "succeeded") {
      console.error('预测超时');
      throw new Error('图像转换超时');
    }

    // 下载生成的图片
    const generatedImageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    console.log('生成的图片URL:', generatedImageUrl);

    if (!generatedImageUrl) {
      console.error('错误: 没有生成图片URL');
      throw new Error('没有生成图片URL');
    }

    try {
      const generatedImageResponse = await axios.get(generatedImageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const resultPath = `results/result-${Date.now()}.jpg`;
      fs.writeFileSync(resultPath, generatedImageResponse.data);
      console.log('结果图片已保存到:', resultPath);

      // 返回结果
      res.json({ resultImageUrl: '/' + resultPath });
    } catch (downloadError) {
      console.error('下载生成的图片时出错:', downloadError.message);
      throw new Error('下载生成的图片失败');
    }
    
  } catch (error) {
    console.error('处理过程中出错:');
    if (error.response) {
      // 服务器响应了，但状态码不是2xx
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      // 请求已发送，但没有收到响应
      console.error('没有收到响应');
    } else {
      // 设置请求时发生错误
      console.error('错误信息:', error.message);
    }
    
    res.status(500).json({ 
      error: '图像转换失败', 
      details: error.message 
    });
  }
});

// 添加API测试端点
app.get('/test-api', async (req, res) => {
  console.log('测试API连接...');
  console.log('API令牌:', apiToken ? `存在 (长度: ${apiToken.length})` : '缺失');
  
  try {
    const response = await axios.get('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${apiToken}`
      },
      timeout: 10000 // 10秒超时
    });
    
    console.log('API连接成功');
    res.json({ 
      success: true, 
      message: 'API连接成功',
      models: response.data.results.slice(0, 3).map(m => m.name)
    });
  } catch (error) {
    console.error('API连接失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('没有收到响应');
    } else {
      console.error('错误信息:', error.message);
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 添加一个端点来查找可用的模型
app.get('/find-models', async (req, res) => {
  console.log('查找可用模型...');
  
  try {
    const response = await axios.get('https://api.replicate.com/v1/models?query=ghibli', {
      headers: {
        'Authorization': `Token ${apiToken}`
      }
    });
    
    console.log('找到模型:', response.data.results.length);
    res.json({ 
      success: true, 
      models: response.data.results.map(m => ({
        name: m.name,
        owner: m.owner,
        description: m.description,
        url: m.url
      }))
    });
  } catch (error) {
    console.error('查找模型失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).send('服务器正在运行');
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`API令牌状态: ${apiToken ? '已设置' : '未设置'}`);
  console.log('确保您的.env文件包含有效的REPLICATE_API_TOKEN');
});
