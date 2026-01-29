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
│   │   ├── rag/
│   │   │   ├── status/route.ts        # GET /api/rag/status
│   │   │   └── test-query/route.ts    # POST /api/rag/test-query
│   │   ├── admin/kb/
│   │   │   ├── upload/route.ts        # POST /api/admin/kb/upload
│   │   │   ├── sources/route.ts       # GET /api/admin/kb/sources
│   │   │   └── [source_id]/approve/route.ts
│   │   └── chat/
│   │       └── route.ts               # POST /api/chat (RAG + citations)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── knowledge-base.tsx             # Governed KB UI (upload + approve)
│   └── rag-status-badge.tsx           # RAG: OFF/DEGRADED/ON badge
└── lib/
    └── kb/                            # Chunking, embedding, retrieval, auditing
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

**Response (includes RAG metadata when enabled):**
```json
{
  "reply": "...",
  "citations": [
    {
      "source_id": "...",
      "source_version": 1,
      "chunk_id": "...",
      "confidence": 0.83,
      "metadata": {}
    }
  ],
  "rag": { "state": "ON" }
}
```

## Governed RAG Runbook (Local-first)

### Classification + ACL rules

- **Public**: eligible for unauthenticated "public-safe spokesman" retrieval.
- **Internal**: only retrievable by authenticated users.
- **Restricted**: retrievable only when the caller is authenticated *and* included in the document ACL.

> ACL and classification enforcement is done at the database layer via RLS + metadata filtering.

### Admin-approved ingestion flow

1) Upload a document (creates a **pending** source + parses it):
- UI: **Knowledge Base** → **Upload**
- API: `POST /api/admin/kb/upload`

2) Approve + index (chunks → embeds → vector index, emits audit events):
- UI: **Approve & Index**
- API: `POST /api/admin/kb/{source_id}/approve`

> Admin allowlist is controlled by `AKIOR_ADMIN_EMAILS` (comma-separated) or `AKIOR_ADMIN_EMAIL_DOMAIN`.

### Verification endpoints

- `GET /api/rag/status`
  - Returns counts + `rag_state: OFF|DEGRADED|ON`.
  - OFF: no approved sources
  - DEGRADED: approved sources exist but vectors missing or retriever failing
  - ON: vectors exist and retriever probe succeeds

- `POST /api/rag/test-query` `{ "q": "...", "topK": 5 }`
  - Returns top chunks + citation IDs **without** generating an answer.

### Proving OFF → ON

1) Before approval: `GET /api/rag/status` should show `rag_state=OFF`.
2) Upload + approve/index a source.
3) After indexing: `GET /api/rag/status` should show `rag_state=ON` and `vectors_total > 0`.

### Redaction & safety

- Audit payloads are redacted to scrub:
  - IPv4 addresses
  - Bearer tokens / API keys
  - configured internal hostnames (`AKIOR_INTERNAL_HOSTNAMES`)
- Raw document content is never written to logs; only IDs/hashes are logged.

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

# Run tests
npm test
```

## License

MIT