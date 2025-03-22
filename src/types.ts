// Prem API Types
export interface PremMessage {
  role: string;
  content?: string;
  template_id?: string;
  params?: Record<string, string>;
}

export interface PremRepository {
  ids: number[];
  similarity_threshold?: number;
  limit?: number;
}

export interface PremChatRequest {
  project_id: string;
  messages: PremMessage[];
  model?: string;
  system_prompt?: string;
  session_id?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  repositories?: PremRepository;
}

export interface PremDocumentChunk {
  repository_id: number;
  document_id: number;
  chunk_id: number;
  document_name: string;
  similarity_score: number;
  content: string;
}

export interface PremChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  document_chunks?: PremDocumentChunk[];
  trace_id?: string;
}

// Tool Types
export interface ChatArgs {
  query: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  repository_ids?: number[];
  similarity_threshold?: number;
  limit?: number;
} 