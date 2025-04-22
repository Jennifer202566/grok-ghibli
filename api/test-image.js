// api/test-image.js
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
      // 检查请求体是否已经被解析
      if (req.body && typeof req.body === 'object') {
        body = req.body;
      } else if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else {
        // 如果请求体尚未解析，手动解析
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const data = Buffer.concat(buffers).toString();
        body = data ? JSON.parse(data) : {};
      }
    } catch (e) {
      console.error('解析请求体失败:', e);
      return res.status(400).json({ error: '无法解析请求体', details: e.message });
    }

    // 现在可以安全地访问 body.image
    const { image } = body;
    
    if (!image) {
      return res.status(400).json({ error: '缺少图像数据' });
    }
    
    // 计算图像大小
    const sizeInBytes = Math.ceil((image.length * 3) / 4);
    const sizeInKB = Math.round(sizeInBytes / 1024);
    
    // 返回图像信息，不调用 Replicate API
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
