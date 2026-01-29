export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: Message[];
  conversationId?: string;
  isPublic?: boolean;
  channel?: 'chat' | 'voice' | 'hud' | 'public' | 'unknown';
}

export interface ChatResponse {
  reply: string;
  conversationId?: string;
  messageId?: string;
  tokensUsed?: number;
}