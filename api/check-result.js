// api/check-result.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: '缺少预测ID' });
    }
    
    const response = await axios.get(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      }
    );
    
    const prediction = response.data;
    
    // 如果预测成功并有输出
    if (prediction.status === 'succeeded' && prediction.output) {
      let outputImage = prediction.output;
      if (Array.isArray(outputImage)) {
        outputImage = outputImage[0];
      }
      
      return res.status(200).json({ 
        status: 'success',
        outputImage: outputImage
      });
    }
    
    // 如果预测失败
    if (prediction.status === 'failed') {
      return res.status(500).json({ 
        status: 'failed',
        error: prediction.error
      });
    }
    
    // 如果预测仍在进行中
    return res.status(200).json({ 
      status: 'processing',
      currentStatus: prediction.status
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
