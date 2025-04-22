// api/model-info.js
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // 获取查询参数
    const { owner, name } = req.query;
    
    if (!owner || !name) {
      return res.status(400).json({ error: '缺少必要的参数: owner 和 name' });
    }
    
    // 获取模型信息
    const modelResponse = await axios.get(
      `https://api.replicate.com/v1/models/${owner}/${name}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      }
    );
    
    // 获取最新版本信息
    const versionId = modelResponse.data.latest_version.id;
    const versionResponse = await axios.get(
      `https://api.replicate.com/v1/models/${owner}/${name}/versions/${versionId}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      }
    );
    
    // 返回模型和版本信息
    return res.status(200).json({
      model: {
        name: modelResponse.data.name,
        owner: modelResponse.data.owner,
        description: modelResponse.data.description,
        visibility: modelResponse.data.visibility
      },
      version: {
        id: versionId,
        created_at: versionResponse.data.created_at,
        openapi_schema: versionResponse.data.openapi_schema
      }
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
