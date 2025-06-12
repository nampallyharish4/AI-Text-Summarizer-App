const axios = require('axios');

async function summarizeText(text) {
  if (!process.env.ACCESS_TOKEN) {
    throw new Error('ACCESS_TOKEN environment variable is not set');
  }

  const data = JSON.stringify({
    inputs: text,
    parameters: {
      max_length: 150,
      min_length: 40,
      do_sample: false
    }
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    
    if (response.data && response.data[0] && response.data[0].summary_text) {
      return response.data[0].summary_text;
    } else {
      throw new Error('Invalid response format from Hugging Face API');
    }
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      throw new Error(`API request failed: ${error.response.status}`);
    } else {
      console.error('Network Error:', error.message);
      throw new Error('Network error occurred');
    }
  }
}

module.exports = summarizeText;