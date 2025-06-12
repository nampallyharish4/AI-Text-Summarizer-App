const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const summarizeText = require('./summarize.js');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/summarize', async (req, res) => {
  try {
    const { text_to_summarize } = req.body;
    
    if (!text_to_summarize) {
      return res.status(400).json({ error: 'Text to summarize is required' });
    }

    if (text_to_summarize.length < 200) {
      return res.status(400).json({ error: 'Text must be at least 200 characters long' });
    }

    if (text_to_summarize.length > 100000) {
      return res.status(400).json({ error: 'Text must be less than 100,000 characters' });
    }

    const summary = await summarizeText(text_to_summarize);
    res.send(summary);
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});