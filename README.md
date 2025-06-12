# AI Text Summarizer App

A modern, responsive web application that uses AI to summarize long text content. Built with React, TypeScript, and powered by Hugging Face's state-of-the-art language models.

## ✨ Features

- **AI-Powered Summarization**: Uses Hugging Face's BART model for high-quality text summarization
- **Smart Text Processing**: Automatically handles long texts by chunking and processing them efficiently
- **Real-time Statistics**: Shows character count, word count, and compression ratios
- **Modern UI/UX**: Beautiful glass morphism design with smooth animations
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Export Options**: Copy to clipboard or download summaries as text files
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Vite** for development and building

### Backend
- **Node.js** with Express
- **Hugging Face Inference API** for AI summarization
- **Axios** for HTTP requests
- **CORS** for cross-origin requests
- **dotenv** for environment configuration

### AI Model
- **facebook/bart-large-cnn** - A state-of-the-art model specifically fine-tuned for summarization tasks

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hugging Face API key (free at [huggingface.co](https://huggingface.co))

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-text-summarizer.git
cd ai-text-summarizer
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the `server` directory:
```env
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
PORT=3001
```

To get your Hugging Face API key:
1. Go to [huggingface.co](https://huggingface.co)
2. Sign up for a free account
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions

### 5. Start the Development Servers

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend Development Server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎯 Usage

1. **Enter Text**: Paste or type your text (minimum 200 characters, maximum 100,000 characters)
2. **Summarize**: Click the "Summarize Text" button or use Ctrl+Enter
3. **Review**: The AI will generate a concise summary of your text
4. **Export**: Copy to clipboard or download the summary as a text file

## 🔧 API Endpoints

### POST `/api/summarize`
Summarizes the provided text using AI.

**Request Body:**
```json
{
  "text": "Your long text content here..."
}
```

**Response:**
```json
{
  "summary": "AI-generated summary...",
  "originalLength": 1500,
  "summaryLength": 200,
  "compressionRatio": 87
}
```

### GET `/api/health`
Health check endpoint for monitoring server status.

## 🏗️ Building for Production

### Frontend
```bash
npm run build
```

### Backend
```bash
cd server
npm start
```

## 🎨 Customization

### Themes
The app supports both light and dark themes. You can customize the color schemes in `src/index.css` and `tailwind.config.js`.

### AI Model
You can change the AI model by updating the `HUGGINGFACE_API_URL` in `server/summarize.js`. Popular alternatives include:
- `facebook/bart-large-cnn` (current, best for news articles)
- `google/pegasus-xsum` (good for general text)
- `microsoft/DialoGPT-medium` (for conversational text)

### Text Limits
Adjust text limits in both frontend (`src/App.tsx`) and backend (`server/summarize.js`):
- Minimum characters: Currently 200
- Maximum characters: Currently 100,000

## 🔍 Troubleshooting

### Common Issues

**"API key not configured" error:**
- Ensure your `.env` file is in the `server` directory
- Check that your Hugging Face API key is valid
- Restart the backend server after adding the API key

**"Model is loading" error:**
- Hugging Face models need to "warm up" on first use
- Wait 10-20 seconds and try again
- This only happens on the first request

**Connection errors:**
- Ensure both frontend (port 5173) and backend (port 3001) servers are running
- Check that no firewall is blocking the connections

## 📊 Performance

- **Text Processing**: Handles up to 100,000 characters
- **Response Time**: Typically 3-10 seconds depending on text length
- **Accuracy**: Uses state-of-the-art BART model with high summarization quality
- **Rate Limits**: Respects Hugging Face API rate limits (free tier: 1000 requests/month)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Harish Nampally**
- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/your-profile)

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co) for providing the AI models and API
- [Facebook AI](https://ai.facebook.com) for the BART model
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Framer Motion](https://framer.com/motion) for smooth animations

---

⭐ If you found this project helpful, please give it a star on GitHub!