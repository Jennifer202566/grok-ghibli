// api/parse-test.js
const bodyParser = require('body-parser');

// 创建一个解析 JSON 的中间件
const jsonParser = bodyParser.json({ limit: '5mb' });

// 使用 Promise 包装中间件
const parseJson = (req, res) => {
  return new Promise((resolve, reject) => {
    jsonParser(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

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
    // 解析请求体
    await parseJson(req, res);
    
    // 现在可以安全地访问 req.body
    const { image } = req.body || {};
    
    if (!image) {
      return res.status(400).json({ error: '缺少图像数据' });
    }
    
    // 计算图像大小
    const sizeInBytes = Math.ceil((image.length * 3) / 4);
    const sizeInKB = Math.round(sizeInBytes / 1024);
    
    // 返回图像信息
    return res.status(200).json({ 
      message: '图像接收成功',
      imageSize: `${sizeInKB} KB`,
      imagePreview: `data:image/jpeg;base64,${image.substring(0, 100)}...`
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
