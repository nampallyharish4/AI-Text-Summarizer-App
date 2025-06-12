const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const summarizeRoute = require('./summarize');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', summarizeRoute);

app.get('/', (req, res) => {
  res.json({ message: 'AI Text Summarizer Server is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});