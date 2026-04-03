# AKIOR Console - Enterprise Features

## Overview

AKIOR Console is an enterprise-grade AI assistant platform with knowledge base management, conversation persistence, and voice capabilities.

## Architecture

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: Shadcn/UI + Tailwind CSS
- **State**: React Context + Hooks
- **Auth**: Supabase Auth

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI GPT-4o-mini, TTS-1, text-embedding-3-small

## Features

### 🔐 Authentication
- Email/password authentication via Supabase
- Session management with auto-refresh
- Secure sign-out with state cleanup
- Protected routes and API endpoints

### 💬 Chat System
- Full conversation persistence
- Message history with pagination
- Conversation management (create, rename, delete)
- Real-time message streaming ready

### 📚 Knowledge Base (RAG)
- Document upload and management
- Vector embeddings for semantic search
- Automatic embedding generation
- Retry mechanism for failed embeddings

### 🧠 Memory System
- Automatic fact extraction from conversations
- Long-term memory with importance scoring
- Memory management (view, delete)
- Vector-indexed for relevant recall

### 🎙️ Voice Interface
- Push-to-talk speech recognition
- OpenAI TTS with 6 voice options
- Adjustable speech speed
- Auto-speak responses toggle

### 🤖 Agent Customization
- Custom agent name
- Personality prompt configuration
- Voice selection and speed
- Preset personalities

## API Endpoints

### Chat
- `POST /api/chat` - Send message and get response

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `PATCH /api/conversations` - Rename conversation
- `DELETE /api/conversations?id=xxx` - Delete conversation
- `GET /api/conversations/[id]/messages` - Get messages

### Knowledge Base
- `POST /api/embeddings` - Generate embeddings

### Voice
- `POST /api/tts` - Generate speech
- `GET /api/tts` - List available voices

### Monitoring
- `GET /api/health` - Health check

## Security Features

### Rate Limiting
- 60 requests per minute per IP
- Separate limits for expensive operations (TTS)
- Rate limit headers in responses

### Input Validation
- Request body validation
- UUID format validation
- String sanitization
- Length limits

### Database Security
- Row Level Security (RLS) on all tables
- User isolation policies
- Cascade deletes for referential integrity

### Error Handling
- Graceful error responses
- User-friendly error messages
- Development-only error details
- Error boundaries in UI

## Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Optional (for full functionality)
```env
OPENAI_API_KEY=your_openai_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

### Tables
- `profiles` - User profiles
- `agent_settings` - Agent configuration per user
- `knowledge_base` - Documents with embeddings
- `conversations` - Chat conversations
- `messages` - Individual messages
- `memories` - Long-term memory facts

### Functions
- `match_knowledge` - Vector similarity search for knowledge
- `match_memories` - Vector similarity search for memories
- `handle_new_user` - Auto-create profile on signup

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "2.0.0",
  "services": {
    "database": { "status": "up", "latency": 50 },
    "openai": { "status": "up" },
    "auth": { "status": "up" }
  },
  "uptime": 3600
}
```

## Public Interface

A minimal, free public chat interface is available at `/ask`:
- No login required
- Limited context (6 messages)
- Information only (no actions)
- Encourages sign-up for full features

## Development

### Start Development Server
```bash
npm run dev
```

### Type Checking
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

## License

Proprietary - All rights reserved
