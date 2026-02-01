/**
 * Chat API Type Definitions
 * Ensures type safety across client and server
 */

export type MessageRole = 'user' | 'assistant' | 'system';
export type ChannelType = 'chat' | 'voice' | 'hud' | 'public' | 'unknown';
export type RAGState = 'OFF' | 'ON' | 'DEGRADED';
export type UserRole = 'public' | 'user' | 'admin';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: Message[];
  conversationId?: string;
  isPublic?: boolean;
  channel?: ChannelType;
}

export interface Citation {
  source_id: string;
  source_version: number;
  chunk_id: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface RAGInfo {
  state: RAGState;
  role?: UserRole;
  trace_id?: string;
}

export interface ChatResponse {
  reply: string;
  conversationId?: string;
  messageId?: string;
  tokensUsed?: number;
  citations?: Citation[];
  rag?: RAGInfo;
}