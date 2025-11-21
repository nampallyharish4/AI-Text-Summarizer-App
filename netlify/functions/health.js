exports.handler = (event, _context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only GET requests are allowed'
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'OK',
      message: 'AI Text Summarizer API is running',
      timestamp: new Date().toISOString(),
      mode: process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_api_key_here' ? 'ai' : 'demo',
      platform: 'netlify-functions'
    }),
  };
};