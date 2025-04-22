// api/models.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.replicate.com/v1/models',
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      }
    );
    
    // 只返回前 10 个模型
    const models = response.data.results.slice(0, 10).map(model => ({
      name: model.name,
      owner: model.owner,
      description: model.description,
      visibility: model.visibility
    }));
    
    return res.status(200).json({ 
      models,
      count: response.data.results.length
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
