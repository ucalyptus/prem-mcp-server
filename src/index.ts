#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Prem from "@premai/prem-sdk";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const API_KEY = process.env.PREM_API_KEY;
const PROJECT_ID = process.env.PREM_PROJECT_ID;

if (!API_KEY) {
  throw new Error("PREM_API_KEY environment variable is required");
}

if (!PROJECT_ID) {
  throw new Error("PREM_PROJECT_ID environment variable is required");
}

/**
 * Prem AI MCP Server
 * 
 * This MCP server integrates Prem AI's capabilities with Claude and other MCP-compatible clients.
 * Prem provides chat completions and RAG capabilities through its API.
 * 
 * The server provides a 'chat' tool that enables:
 * - Chat completions with optional streaming
 * - RAG-enhanced responses using repository context
 * - Support for prompt templates
 */

const API_CONFIG = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  DEFAULT_SIMILARITY_THRESHOLD: 0.65,
  DEFAULT_LIMIT: 3
} as const;

// For debugging
const log = (message: string) => {
  console.error(`[PREM-MCP-DEBUG] ${message}`);
};

class PremServer {
  private server: McpServer;
  private client: Prem;
  private activeRequests = new Set<string>();

  constructor() {
    this.server = new McpServer({
      name: "prem-ai-server",
      version: "0.1.0"
    });
    
    this.client = new Prem({
      apiKey: API_KEY as string
    });
    
    log("Server initialized");
  }

  private setupTools(): void {
    // Chat tool
    this.server.tool(
      "chat",
      "Chat with Prem AI - supports chat completions with optional RAG capabilities.",
      {
        query: z.string().describe("The chat message to send"),
        system_prompt: z.string().optional().describe("Optional system prompt to guide the model's behavior"),
        model: z.string().optional().describe("Optional model to use for completion"),
        temperature: z.number().optional().describe("Optional temperature for response generation"),
        max_tokens: z.number().optional().describe("Optional maximum tokens to generate"),
        repository_ids: z.array(z.number()).optional().describe("Optional array of repository IDs for RAG"),
        similarity_threshold: z.number().optional().describe("Optional similarity threshold for RAG"),
        limit: z.number().optional().describe("Optional limit of context chunks for RAG")
      },
      async ({ query, system_prompt, model, temperature, max_tokens, repository_ids, similarity_threshold, limit }) => {
        const requestId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        this.activeRequests.add(requestId);
        
        try {
          const chatRequest = {
            project_id: PROJECT_ID as string,
            messages: [{ role: "user", content: query }],
            ...(model && { model }),
            ...(system_prompt && { system_prompt }),
            ...(temperature && { temperature }),
            ...(max_tokens && { max_tokens }),
            ...(repository_ids && {
              repositories: {
                ids: repository_ids,
                similarity_threshold: similarity_threshold || 0.65,
                limit: limit || 3
              }
            })
          };
          
          const response = await this.client.chat.completions.create(chatRequest as any);
          const responseData = 'choices' in response ? response : { choices: [] };

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify(responseData, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text" as const,
              text: `Chat error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        } finally {
          this.activeRequests.delete(requestId);
        }
      }
    );

    // Document upload tool
    this.server.tool(
      "prem_upload_document",
      "Upload a document to a Prem AI repository",
      {
        repository_id: z.string().describe("ID of the repository to upload to"),
        file_path: z.string().describe("Path to the file to upload")
      },
      async ({ repository_id, file_path }) => {
        const requestId = uuidv4();
        log(`[${requestId}] Starting document upload to repository ${repository_id}`);
        
        try {
          if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
          }

          const formData = new FormData();
          const fileStream = fs.createReadStream(file_path);
          const fileName = path.basename(file_path);
          
          formData.append('file', fileStream, {
            filename: fileName,
            contentType: 'text/plain',
            knownLength: fs.statSync(file_path).size
          });

          const response = await this.client.repository.document.create(
            repository_id,
            {
              data: formData,
              headers: {
                ...formData.getHeaders(),
                'Content-Type': 'multipart/form-data'
              }
            }
          );

          log(`[${requestId}] Document upload successful: ${JSON.stringify(response)}`);
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify(response, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log(`[${requestId}] Document upload error: ${errorMessage}`);
          return {
            content: [{
              type: "text" as const,
              text: `Document upload error: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );

    // Template chat tool
    this.server.tool(
      "prem_chat_with_template",
      "Chat using a predefined Prem AI prompt template",
      {
        template_id: z.string().describe("ID of the prompt template to use"),
        params: z.record(z.string()).describe("Parameters to fill in the template"),
        model: z.string().optional().describe("Optional model to use"),
        temperature: z.number().optional().describe("Optional temperature parameter"),
        max_tokens: z.number().optional().describe("Optional maximum tokens to generate")
      },
      async ({ template_id, params, model, temperature, max_tokens }) => {
        const requestId = `template-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        this.activeRequests.add(requestId);
        
        try {
          const chatRequest = {
            project_id: PROJECT_ID as string,
            messages: [{
              role: "user",
              template_id,
              params
            }],
            ...(model && { model }),
            ...(temperature && { temperature }),
            ...(max_tokens && { max_tokens })
          };

          const response = await this.client.chat.completions.create(chatRequest as any);
          const responseData = 'choices' in response ? response : { choices: [] };

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify(responseData, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text" as const,
              text: `Template chat error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        } finally {
          this.activeRequests.delete(requestId);
        }
      }
    );
    
    log("All tools registered");
  }

  async run(): Promise<void> {
    try {
      this.setupTools();
      
      log("Starting Prem MCP server...");
      const transport = new StdioServerTransport();
      
      transport.onerror = (error) => {
        log(`Transport error: ${error.message}`);
      };
      
      await this.server.connect(transport);
      log("Prem AI MCP server running on stdio");
    } catch (error) {
      log(`Server initialization error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

// Create and run the server with proper error handling
(async () => {
  try {
    const server = new PremServer();
    await server.run();
  } catch (error) {
    log(`Fatal server error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
})(); 