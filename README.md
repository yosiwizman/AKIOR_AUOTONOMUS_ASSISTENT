# AKIOR Voice Console

A minimal push-to-talk voice interface for interacting with an AI assistant. Built as a reliable demo tool for operators with browser-native speech recognition and synthesis.

## Features

- **Push-to-Talk Voice Input**: Click the microphone button to speak (uses Web Speech API)
- **Text Input Fallback**: Type messages directly if voice is unavailable
- **AKIOR Persona Responses**: Technical, structured responses with bullet points
- **Text-to-Speech**: Toggle to have responses spoken aloud
- **Conversation History**: Last 20 turns retained in-memory
- **No External Dependencies**: Runs entirely locally without API keys

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Browser Requirements

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Speech Recognition | ✅ Full | ✅ Full | ❌ No | ❌ No |
| Speech Synthesis | ✅ Full | ✅ Full | ✅ Full | ✅ Full |

**Recommended**: Google Chrome or Microsoft Edge for full functionality.

> **Note**: Speech recognition requires HTTPS in production. Localhost works without HTTPS during development.

## Architecture

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # POST /api/chat endpoint
│   ├── globals.css           # AKIOR theme styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page (renders VoiceConsole)
├── components/
│   └── voice-console.tsx     # Main UI component
└── hooks/
    ├── use-speech-recognition.ts  # Web Speech API STT hook
    └── use-speech-synthesis.ts    # Web Speech API TTS hook
```

## API Reference

### POST /api/chat

Send a message and receive an AKIOR-style response.

**Request:**
```json
{
  "message": "Your question or statement",
  "history": [
    { "role": "user", "content": "Previous user message" },
    { "role": "assistant", "content": "Previous assistant response" }
  ]
}
```

**Response:**
```json
{
  "reply": "AKIOR's response with technical details..."
}
```

## Integrating a Real LLM

The response generation is isolated in a single function for easy replacement:

### Location
`src/app/api/chat/route.ts` → `generateAkiorResponse()` function

### Example: OpenAI Integration

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAkiorResponse(message: string, history: Message[]): Promise<string> {
  const systemPrompt = `You are AKIOR, a technical AI assistant. 
  - Be concise and technical
  - Use structured bullet points
  - Ask follow-up questions only if absolutely required
  - Never overclaim capabilities`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || 'No response generated.';
}
```

### Example: Anthropic Integration

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateAkiorResponse(message: string, history: Message[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 500,
    system: `You are AKIOR, a technical AI assistant. Be concise, use bullet points, never overclaim.`,
    messages: [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message }
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : 'No response generated.';
}
```

## UI Components

### Status Indicator
Shows current state: Ready, Listening, Processing, Sending, Error, or Voice Unavailable.

### Push-to-Talk Button
Large circular button that toggles speech recognition. Glows green when listening.

### Transcript Box
Editable text area showing recognized speech. Can be manually edited before sending.

### Response Box
Displays AKIOR's response with optional TTS playback.

### History Panel
Scrollable list of conversation turns with timestamps. Limited to 20 turns (40 messages).

### Speak Answer Toggle
Enables/disables automatic text-to-speech for responses.

## Troubleshooting

### "Speech recognition not supported"
- Use Chrome or Edge browser
- Ensure you're on localhost or HTTPS

### "Microphone access denied"
- Click the lock icon in the address bar
- Allow microphone permissions
- Refresh the page

### No response from API
- Check browser DevTools console for errors
- Verify the development server is running
- Check Network tab for /api/chat requests

### TTS not working
- Check browser volume settings
- Try a different voice in browser settings
- Some browsers require user interaction before TTS works

## Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## License

MIT
