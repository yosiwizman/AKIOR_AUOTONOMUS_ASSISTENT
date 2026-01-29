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

export type Citation = {
  source_id: string;
  source_version: number;
  chunk_id: string;
  confidence: number;
  metadata: Record<string, unknown>;
};

export interface ChatResponse {
  reply: string;
  conversationId?: string;
  messageId?: string;
  tokensUsed?: number;
  citations?: Citation[];
  rag?: {
    state: 'OFF' | 'ON' | 'DEGRADED';
    role?: 'public' | 'user' | 'admin';
    trace_id?: string;
  };
}