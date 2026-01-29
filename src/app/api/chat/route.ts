/**
 * AKIOR Voice Console - Chat API Endpoint
 * 
 * POST /api/chat
 * Body: { message: string, history: Array<{ role: 'user' | 'assistant', content: string }> }
 * Response: { reply: string }
 * 
 * This endpoint generates responses using an AKIOR engineer persona.
 * The generateAkiorResponse function is the single boundary where you can
 * plug in a real LLM (OpenAI, Anthropic, etc.) later.
 */

import { NextRequest, NextResponse } from 'next/server';

// Types for conversation history
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: Message[];
}

interface ChatResponse {
  reply: string;
}

/**
 * AKIOR Engineer Persona Response Generator
 * 
 * This is the SINGLE FUNCTION BOUNDARY where you can plug in a real LLM.
 * Replace the logic inside this function with your LLM API call.
 * 
 * Current behavior: Deterministic, technical, structured responses
 * - Concise and technical
 * - Uses structured bullets
 * - Asks follow-up only if absolutely required
 * - Never overclaims
 */
function generateAkiorResponse(message: string, history: Message[]): string {
  const lowerMessage = message.toLowerCase();
  const timestamp = new Date().toISOString();
  
  // Log request for debugging
  console.log(`[${timestamp}] AKIOR Chat Request:`, { message, historyLength: history.length });

  // Technical greeting
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `AKIOR Console initialized.

• System status: Operational
• Voice recognition: Active
• Ready to assist with technical queries

What would you like to analyze or discuss?`;
  }

  // Help/capabilities query
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities')) {
    return `AKIOR Console Capabilities:

• Voice Input: Push-to-talk speech recognition
• Text Input: Manual query entry
• Response Synthesis: Text-to-speech output
• History: Last 20 conversation turns retained

Technical Notes:
- Uses browser Web Speech API (Chrome recommended)
- Responses are currently stubbed; LLM integration point is clearly marked in /api/chat
- All processing is local; no external API keys required

How can I assist with your technical requirements?`;
  }

  // Status query
  if (lowerMessage.includes('status') || lowerMessage.includes('system')) {
    return `System Status Report:

• API: Online
• Speech Recognition: Browser-dependent
• Text-to-Speech: Browser-dependent
• Memory: ${history.length} turns in context

All systems nominal.`;
  }

  // Technical question patterns
  if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why') || lowerMessage.includes('explain')) {
    // Check for specific technical topics
    if (lowerMessage.includes('speech') || lowerMessage.includes('voice')) {
      return `Voice Processing Overview:

• Speech-to-Text: Web Speech API (SpeechRecognition)
  - Continuous recognition mode
  - Interim results for real-time feedback
  - Browser-native, no external dependencies

• Text-to-Speech: Web Speech API (speechSynthesis)
  - Configurable voice selection
  - Rate and pitch adjustable
  - Toggle-controlled activation

Limitation: Requires compatible browser (Chrome/Edge recommended).`;
    }

    if (lowerMessage.includes('api') || lowerMessage.includes('backend') || lowerMessage.includes('server')) {
      return `Backend Architecture:

• Framework: Next.js API Routes
• Endpoint: POST /api/chat
• Request Format:
  \`\`\`json
  {
    "message": "user query",
    "history": [{ "role": "user|assistant", "content": "..." }]
  }
  \`\`\`

• Response Format:
  \`\`\`json
  { "reply": "AKIOR response" }
  \`\`\`

LLM Integration Point: Replace generateAkiorResponse() function in /api/chat/route.ts`;
    }

    // Generic technical response
    return `Analysis of query: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"

Current implementation provides stubbed responses. For production use:

• Integration Point: generateAkiorResponse() in /api/chat/route.ts
• Recommended: OpenAI GPT-4, Anthropic Claude, or similar
• Context: Full conversation history is passed to the function

Would you like specific implementation guidance for a particular LLM provider?`;
  }

  // Error/issue patterns
  if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('not working')) {
    return `Troubleshooting Guide:

Common Issues:
• "Speech not available": Use Chrome/Edge browser
• "Microphone blocked": Check browser permissions
• "No response": Verify API endpoint is running

Debug Steps:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify Network tab shows /api/chat requests

What specific error are you encountering?`;
  }

  // Default technical response
  const contextNote = history.length > 0 
    ? `\n\nContext: ${history.length} previous turn(s) in memory.`
    : '';

  return `Acknowledged: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"

This is a stubbed response from the AKIOR Console demo.

To enable intelligent responses:
• Locate: /api/chat/route.ts
• Modify: generateAkiorResponse() function
• Add: Your preferred LLM API integration${contextNote}

Is there a specific technical topic I can help clarify?`;
}

/**
 * POST /api/chat
 * Main chat endpoint handler
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  const timestamp = new Date().toISOString();
  
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    // Validate request
    if (!message || typeof message !== 'string') {
      console.log(`[${timestamp}] Invalid request: missing message`);
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Trim history to last 20 turns
    const trimmedHistory = history.slice(-20);

    // Generate response
    const reply = generateAkiorResponse(message.trim(), trimmedHistory);

    console.log(`[${timestamp}] AKIOR Chat Response generated (${reply.length} chars)`);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error(`[${timestamp}] Chat API Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
