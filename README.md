# Talk to Jules

Voice to prompt running in Jules - A mobile-friendly Next.js application that enables voice recording and transcription using Gemini Flash 2.5 AI.

## Project Overview

This application provides a simple, mobile-friendly interface for recording audio and transcribing it using Google's Gemini AI. It's designed to work seamlessly on both desktop and mobile devices.

## Features

- ✨ **Large, Easy-to-Use Record Button** - Simple one-tap recording interface
- 🎤 **Audio Recording** - Browser-based audio recording using MediaRecorder API
- 🤖 **AI Transcription** - Powered by Gemini Flash 2.5 for accurate transcriptions
- 📱 **Mobile-Friendly** - Responsive design optimized for mobile devices
- 🔐 **Secure API Key Storage** - API keys stored locally in browser
- 📝 **Transcription History** - View all your transcriptions in one place
- 🌙 **Dark Mode Support** - Automatic dark mode based on system preferences

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Audio Recording**: MediaRecorder API (browser native)
- **AI**: Google Gemini Flash 2.5 API
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- A Gemini API key from Google AI Studio

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jonmrjr/talk-to-jules.git
cd talk-to-jules
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

1. Click the settings icon (⚙️) in the top-right corner
2. Enter your **Gemini API Key** (required for transcription)
3. Enter your **Jules API Key** (optional, for future features)
4. Click "Save"

Your API keys are stored securely in your browser's local storage and never sent to any server except the official Gemini API.

## How to Use

1. **Configure API Keys**: On first launch, you'll be prompted to enter your API keys
2. **Start Recording**: Click the large blue microphone button to start recording
3. **Stop Recording**: Click the red button again to stop and transcribe
4. **View Transcription**: Your transcription will appear below the record button
5. **Repeat**: Record as many times as you need!

## Audio Recording Mechanism

The app uses the browser's native **MediaRecorder API** for audio capture, inspired by the YakGPT project. This approach:

- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- No external dependencies for recording
- Supports both desktop and mobile devices
- Automatically selects the best audio format (webm or mp4)
- Provides real-time feedback during recording

## Project Structure

```
talk-to-jules/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── AudioRecorder.tsx   # Audio recording component
│   └── Settings.tsx        # Settings modal component
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── README.md               # This file
```

## Development Plan & Execution

### Implementation Status

- [x] 1. Initialize Next.js application with TypeScript ✅
- [x] 2. Set up basic project structure (pages, components, styles) ✅
- [x] 3. Create settings page for GEMINI and JULES API keys (using localStorage) ✅
- [x] 4. Implement audio recording component using MediaRecorder API (based on YakGPT) ✅
- [x] 5. Create main page with large record button ✅
- [x] 6. Integrate Gemini Flash 2.5 API for audio transcription ✅
- [x] 7. Add mobile-friendly responsive design ✅
- [x] 8. Update README.md with project documentation and execution plan ✅
- [ ] 9. Test the application locally
- [ ] 10. Final review and cleanup

### Recent Updates

- **Initial Setup** (2025-11-23): Created Next.js application with TypeScript and Tailwind CSS
- **Core Components** (2025-11-23): Implemented AudioRecorder and Settings components
- **API Integration** (2025-11-23): Integrated Gemini Flash 2.5 for transcription
- **UI/UX** (2025-11-23): Added responsive design with dark mode support

## API Keys

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key and paste it into the app settings

### Jules API Key (Optional)

The Jules API key field is reserved for future integration with the Jules AI assistant platform.

## Browser Compatibility

- ✅ Chrome 49+
- ✅ Firefox 25+
- ✅ Safari 14.1+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Microphone Access Denied
- Ensure you've granted microphone permissions to your browser
- On iOS, check Settings > Safari > Microphone
- On Android, check browser app permissions

### Transcription Errors
- Verify your Gemini API key is correct
- Check your internet connection
- Ensure you're speaking clearly and the recording has audio

### Build Errors
- Try deleting `node_modules` and `.next` folders
- Run `npm install` again
- Ensure Node.js version is 18.0 or higher

## Future Enhancements

- Integration with Jules AI assistant
- Support for multiple languages
- Audio playback of recordings
- Export transcriptions
- Voice commands
- Conversation history
- Real-time transcription

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [YakGPT](https://github.com/yakGPT/yakGPT) for the audio recording mechanism
- Built with [Next.js](https://nextjs.org/)
- Powered by [Google Gemini AI](https://deepmind.google/technologies/gemini/)

---

**Note**: This is a client-side application. All API keys are stored in your browser's local storage and are never sent to any server except the official Gemini API endpoints.