# CLAUDE.md - AI Assistant Guide for personal-os

## Project Overview

**personal-os** is an AI-powered personal assistant backend that implements an autonomous agent system. It processes user requests through a chain-of-thought pattern (Think-Use-Act loop) with specialized tools for diving logbooks, document processing, and web scraping.

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Bun (v1.1.34+) |
| Language | TypeScript 5.x |
| Web Framework | Hono |
| AI SDK | Vercel AI SDK (@ai-sdk/google, @ai-sdk/openai) |
| LLM | Google Gemini 2.5-flash (primary), OpenAI text-embedding-3-large (embeddings) |
| Observability | Langfuse (tracing, prompt management) |
| State Management | Immer (immutable updates) |
| Validation | Zod |
| Containerization | Docker |

## Directory Structure

```
personal-os/
├── index.ts                      # Entry point - Hono server setup
├── src/
│   ├── config/
│   │   └── tools.config.ts      # Tool registry (logbook, document_processor, web)
│   ├── services/
│   │   ├── ai.service.ts        # Core agent: think → use → act → process loop
│   │   ├── llm.service.ts       # LLM abstraction (completion, embedding)
│   │   ├── langfuse.service.ts  # Tracing and observability
│   │   ├── document.service.ts  # In-memory document store
│   │   ├── text.service.ts      # Text chunking utilities
│   │   ├── upload.service.ts    # File storage management
│   │   └── tools/               # Tool implementations
│   │       ├── logbook.service.ts          # Diving logbook (add/read dives)
│   │       ├── web.service.ts              # Web scraping via Serper API
│   │       └── document.processor.service.ts # Document synthesis
│   ├── routes/
│   │   ├── ai.ts                # POST /api/ai/chat - main agent endpoint
│   │   └── files.ts             # GET /api/files/:uuid - file retrieval
│   ├── middlewares/
│   │   └── attachments.middleware.ts  # Multipart content processing
│   ├── types/
│   │   ├── agent.ts             # State, Document, ToolCall interfaces
│   │   ├── llm.ts               # Completion config types
│   │   └── logbook.ts           # Logbook types
│   ├── prompts/
│   │   ├── agent.use.ts         # Tool action selection prompt
│   │   ├── agent.answer.ts      # Final answer generation prompt
│   │   └── synthetize.ts        # Document synthesis prompt
│   └── utils/
│       └── agent.ts             # Agent utility functions
├── storage/                      # Runtime file storage (gitignored)
│   ├── image/
│   ├── document/
│   └── text/
└── .github/workflows/
    └── build-deploy.yml         # CI/CD pipeline
```

## Core Architecture

### Agent Loop (Think-Use-Act Pattern)

The agent in `src/services/ai.service.ts` follows this flow:

```
User Request
     ↓
[THINK] LLM decides which tool to use
     ↓
[USE] LLM decides action + parameters for the tool
     ↓
[ACT] Execute tool, collect results as documents
     ↓
[Repeat until final_answer or max_steps]
     ↓
Generate final response using collected documents
```

### State Management

State is managed immutably using Immer with this structure:

```typescript
interface State {
    conversation_uuid: string;
    messages: CoreMessage[];
    step: number;
    max_steps: number;
    thoughts?: { next_action?: string; next_action_reasoning?: string };
    documents: Document[];
    call_stack: ToolCall[];
}
```

### Tool System

Tools are registered in `src/config/tools.config.ts` with:
- **name**: Tool identifier
- **description**: When to use the tool
- **actions**: Array of available actions with instructions
- **executor**: Function that executes the action

Current tools:
| Tool | Actions | Purpose |
|------|---------|---------|
| `logbook` | `add_dive`, `read_dives` | Manage diving records |
| `document_processor` | `synthesize` | Synthesize documents with user query |
| `web` | `scrape_url` | Scrape web pages via Serper API |

## Development Commands

```bash
# Install dependencies
bun install

# Run development server (port 3000)
bun run index.ts

# Build Docker image
docker build -t personal-os .

# Run Docker container
docker run -p 3000:3000 --env-file .env personal-os
```

## Environment Variables

Copy `example.env` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Gemini API key |
| `LANGFUSE_SECRET_KEY` | Yes | Langfuse authentication |
| `LANGFUSE_PUBLIC_KEY` | Yes | Langfuse public key |
| `LANGFUSE_BASE_URL` | Yes | Langfuse endpoint URL |
| `SERPER_API_KEY` | Yes | Web scraping API key |
| `USER_ID` | Yes | User identifier for tracing |
| `APP_URL` | No | Base URL (default: http://localhost:3000) |
| `PORT` | No | Server port (default: 3000) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Main agent endpoint - processes user messages |
| GET | `/api/files/:uuid` | Retrieve uploaded files by UUID |
| POST | `/test` | Development endpoint for image processing |

## Coding Conventions

### File Naming
- Services: `*.service.ts`
- Routes: Short descriptive names (e.g., `ai.ts`, `files.ts`)
- Types: `*.ts` in `/src/types/`
- Prompts: `*.ts` in `/src/prompts/`

### Code Style
- Use TypeScript strict mode
- Prefer async/await over raw promises
- Use Immer's `produce()` for state mutations
- Zod for runtime validation
- Console logging with emoji prefixes for visibility

### Console Log Prefixes
```
🧠 - Thinking/reasoning output
🧰 - Tool selection output
⚙️ - Tool execution output
🔁 - Step progression
```

### Error Handling
- Use try-catch blocks in service methods
- Create error documents for failed operations
- Langfuse captures all errors in traces

### Langfuse Tracing Pattern
```typescript
const generation = langfuseService.startGeneration(parent, { name, model, input });
// ... LLM call
langfuseService.endGeneration(generation, { output: result });
```

## Adding New Tools

1. Create service in `src/services/tools/`:
```typescript
export enum MyToolAction {
    MY_ACTION = "my_action"
}

function createMyToolService() {
    return {
        execute: async (action: MyToolAction, payload: Record<string, any>): Promise<Document> => {
            // Implementation
        }
    }
}

export const myToolService = createMyToolService();
export type { MyToolAction };
```

2. Register in `src/config/tools.config.ts`:
```typescript
{
    name: "my_tool",
    description: "When to use this tool",
    actions: [
        {
            name: "my_action",
            description: "Action description",
            instructions: `{ "param": "type" }`
        }
    ],
    executor: (action, payload) => myToolService.execute(action as MyToolAction, payload)
}
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/build-deploy.yml`):
1. **Build**: Creates Docker image, pushes to GitHub Container Registry
2. **Deploy**: SSH to VPS, pulls image, restarts container on port 40055

Triggers: Push to `main` or PR to `main`

## Testing

Currently no automated test suite. Testing is done manually via HTTP requests to the API endpoints.

## Key Files for Common Tasks

| Task | File(s) |
|------|---------|
| Modify agent behavior | `src/services/ai.service.ts` |
| Change LLM model/settings | `src/services/llm.service.ts` |
| Add new tool | `src/config/tools.config.ts`, `src/services/tools/` |
| Modify prompts | `src/prompts/` |
| Add new endpoint | `src/routes/`, `index.ts` |
| Change state structure | `src/types/agent.ts` |
| Modify tracing | `src/services/langfuse.service.ts` |

## External Dependencies

| Service | Purpose | Config |
|---------|---------|--------|
| Google Gemini | Primary LLM | `GOOGLE_GENERATIVE_AI_API_KEY` |
| OpenAI | Embeddings only | Via @ai-sdk/openai |
| Langfuse | Observability | `LANGFUSE_*` vars |
| Serper API | Web scraping | `SERPER_API_KEY` |
| External webhook | Logbook backend | Hardcoded in logbook.service.ts |
