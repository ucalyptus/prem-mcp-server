# Prem MCP Server
[![smithery badge](https://smithery.ai/badge/@ucalyptus/prem-mcp-server)](https://smithery.ai/server/@ucalyptus/prem-mcp-server)

A Model Context Protocol (MCP) server implementation for [Prem AI](https://premai.io/), enabling seamless integration with Claude and other MCP-compatible clients. This server provides access to Prem AI's powerful features through the MCP interface.

## Features

- 🤖 **Chat Completions**: Interact with Prem AI's language models
- 📚 **RAG Support**: Retrieval-Augmented Generation with document repository integration
- 📝 **Document Management**: Upload and manage documents in repositories
- 🎭 **Template System**: Use predefined prompt templates for specialized outputs
- ⚡ **Streaming Responses**: Real-time streaming of model outputs
- 🛡️ **Error Handling**: Robust error handling and logging

## Prerequisites

- Node.js (v16 or higher)
- A Prem AI account with API key
- A Prem project ID

## Installation

### Installing via Smithery

To install prem-mcp-server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@ucalyptus/prem-mcp-server):

```bash
npx -y @smithery/cli install @ucalyptus/prem-mcp-server --client claude
```

### Installing Manually
```bash
# Using npm
npm install prem-mcp-server

# Using yarn
yarn add prem-mcp-server

# Using pnpm
pnpm add prem-mcp-server
```

## Configuration

### 1. Environment Variables
Create a `.env` file in your project root:
```env
PREM_API_KEY=your_api_key_here
PREM_PROJECT_ID=your_project_id_here
```

### 2. Cursor Configuration
To use the Prem MCP server with Cursor, add the following to your `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "PremAI": {
      "command": "node",
      "args": ["/path/to/your/prem-mcp/build/index.js", "--stdio"],
      "env": {
        "PREM_API_KEY": "your_api_key_here",
        "PREM_PROJECT_ID": "your_project_id_here"
      }
    }
  }
}
```
Replace `/path/to/your/prem-mcp` with the actual path to your project directory.

### 3. Claude Desktop Configuration
For Claude Desktop users, add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "PremAI": {
      "command": "npx",
      "args": ["prem-mcp-server", "--stdio"],
      "env": {
        "PREM_API_KEY": "your_api_key_here",
        "PREM_PROJECT_ID": "your_project_id_here"
      }
    }
  }
}
```

## Usage

### Starting the Server

```bash
npx prem-mcp-server
```

### Example Prompts

1. **Basic Chat**
```
Let's have a conversation about artificial intelligence.
```

2. **RAG with Documents**
```
Based on the documents in repository XYZ, what are the key points about [topic]?
```

3. **Using Templates**
```
Use template ABC to generate [specific type of content].
```

### Document Upload

The server supports uploading documents to Prem AI repositories for RAG operations. Supported formats:
- `.txt`
- `.pdf`
- `.docx`

## API Reference

### Chat Completion Parameters

- `query`: The input text
- `system_prompt`: Custom system prompt
- `model`: Model identifier
- `temperature`: Response randomness (0-1)
- `max_tokens`: Maximum response length
- `repository_ids`: Array of repository IDs for RAG
- `similarity_threshold`: Threshold for document similarity
- `limit`: Maximum number of document chunks

### Template Parameters

- `template_id`: ID of the prompt template
- `params`: Template-specific parameters
- `temperature`: Response randomness (0-1)
- `max_tokens`: Maximum response length

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/prem-mcp-server.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Troubleshooting

### Common Issues

1. **Server Not Found**
   - Verify the server path in `claude_desktop_config.json`
   - Check if the server is running

2. **API Key Invalid**
   - Ensure your Prem AI API key is valid
   - Check if the API key has the required permissions

3. **Document Upload Failed**
   - Verify file format is supported
   - Check file permissions
   - Ensure repository ID is correct

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Prem AI](https://prem.ai/) for their powerful AI platform
- [Model Context Protocol](https://github.com/anthropics/anthropic-tools/tree/main/model-context-protocol) for the protocol specification
- [Anthropic](https://www.anthropic.com/) for Claude and the MCP ecosystem

## Support

For issues and feature requests, please use the GitHub Issues page.
