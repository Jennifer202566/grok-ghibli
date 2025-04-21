// api/env-test.js
module.exports = (req, res) => {
  const apiKey = process.env.REPLICATE_API_TOKEN || 'not set';
  
  // 只显示密钥的前几个字符，保护安全
  const maskedKey = apiKey === 'not set' ? 'not set' : 
                    apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  
  res.status(200).json({
    message: 'Environment variable test',
    apiKeySet: apiKey !== 'not set',
    apiKeyPrefix: maskedKey,
    timestamp: new Date().toISOString()
  });
};
