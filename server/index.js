const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const summarizeRoute = require('./summarize');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] // Replace with your actual frontend domain
    : ['http://localhost:5173', 'http://localhost:3000'], // Development origins
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Increase limit for large texts
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', summarizeRoute);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Text Summarizer Server is running!',
    version: '1.0.0',
    endpoints: {
      summarize: 'POST /api/summarize',
      health: 'GET /api/health'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/summarize`);
  console.log(`🔑 Hugging Face API configured: ${!!process.env.HUGGINGFACE_API_KEY}`);
  
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.warn('⚠️  Warning: HUGGINGFACE_API_KEY not found in environment variables');
    console.warn('   Please create a .env file with your Hugging Face API key');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});