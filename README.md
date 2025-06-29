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
- **Serverless Architecture**: Deployed on Netlify with serverless functions

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Vite** for development and building

### Backend
- **Netlify Functions** (serverless)
- **Hugging Face Inference API** for AI summarization
- **Axios** for HTTP requests

### AI Model
- **facebook/bart-large-cnn** - A state-of-the-art model specifically fine-tuned for summarization tasks

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hugging Face API key (free at [huggingface.co](https://huggingface.co))
- Netlify account (for deployment)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-text-summarizer.git
cd ai-text-summarizer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Get Your Hugging Face API Key
1. Go to [huggingface.co](https://huggingface.co)
2. Sign up for a free account
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions

### 4. Local Development
For local development, you can test the app in demo mode:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🚀 Deployment

### Deploy to Netlify

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Configure Environment Variables:**
   In your Netlify dashboard, go to Site settings → Environment variables and add:
   ```
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   ```

4. **Deploy:**
   Netlify will automatically deploy your site and enable the AI functionality.

## 🎯 Usage

1. **Enter Text**: Paste or type your text (minimum 200 characters, maximum 100,000 characters)
2. **Summarize**: Click the "Summarize Text" button or use Ctrl+Enter
3. **Review**: The AI will generate a concise summary of your text
4. **Export**: Copy to clipboard or download the summary as a text file

## 🔧 API Endpoints

### Netlify Functions

#### `/.netlify/functions/summarize`
Summarizes the provided text using AI.

**Request:**
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
  "compressionRatio": 87,
  "mode": "ai"
}
```

#### `/.netlify/functions/health`
Health check endpoint for monitoring service status.

## 🎨 Customization

### Themes
The app supports both light and dark themes. You can customize the color schemes in `src/index.css` and `tailwind.config.js`.

### AI Model
You can change the AI model by updating the `HUGGINGFACE_API_URL` in `netlify/functions/summarize.js`. Popular alternatives include:
- `facebook/bart-large-cnn` (current, best for news articles)
- `google/pegasus-xsum` (good for general text)
- `microsoft/DialoGPT-medium` (for conversational text)

### Text Limits
Adjust text limits in both frontend (`src/App.tsx`) and backend (`netlify/functions/summarize.js`):
- Minimum characters: Currently 200
- Maximum characters: Currently 100,000

## 🔍 Troubleshooting

### Common Issues

**"API key not configured" error:**
- Ensure your Hugging Face API key is set in Netlify environment variables
- Check that your API key is valid
- Redeploy the site after adding the environment variable

**"Model is loading" error:**
- Hugging Face models need to "warm up" on first use
- Wait 10-20 seconds and try again
- This only happens on the first request

**Demo mode instead of AI mode:**
- Check that `HUGGINGFACE_API_KEY` is properly set in Netlify environment variables
- Verify the API key is valid and has the correct permissions
- Check the Netlify function logs for any errors

## 📊 Performance

- **Text Processing**: Handles up to 100,000 characters
- **Response Time**: Typically 3-10 seconds depending on text length
- **Accuracy**: Uses state-of-the-art BART model with high summarization quality
- **Rate Limits**: Respects Hugging Face API rate limits (free tier: 1000 requests/month)
- **Scalability**: Serverless architecture scales automatically with demand

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
- [Netlify](https://netlify.com) for serverless hosting and functions
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Framer Motion](https://framer.com/motion) for smooth animations

---

⭐ If you found this project helpful, please give it a star on GitHub!