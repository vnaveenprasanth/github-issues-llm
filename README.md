# GitHub Issue Analyzer with Local Caching + LLM Processing

A backend service that fetches GitHub issues from any public repository, caches them locally in SQLite, and analyzes them using Google's Gemini 2.0 LLM.

## Features

- 🔍 **Scan repositories** - Fetch all open issues with pagination support
- 💾 **Local caching** - SQLite database for persistent storage
- 🤖 **LLM Analysis** - Natural language analysis using Gemini 2.0 or other LLMs models in GEMINI
- 📊 **Smart chunking** - Handles large repositories with 100+ issues

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Required: Get from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key

# Optional: Increases GitHub rate limit from 60 to 5000 requests/hour
GITHUB_TOKEN=your_github_personal_access_token

# Optional: Server port (default: 3000)
PORT=3000
```

### 3. Start the server

```bash
npm run dev
```

## API Endpoints

### POST /scan

Fetch and cache all open issues from a GitHub repository.

**Request:**
```json
{
  "repo": "facebook/react"
}
```

**Response:**
```json
{
  "repo": "facebook/react",
  "issues_fetched": 847,
  "cached_successfully": true
}
```

### POST /analyze

Analyze cached issues using natural language prompts.

**Request:**
```json
{
  "repo": "facebook/react",
  "prompt": "What are the main themes across these issues? What should maintainers prioritize?"
}
```

**Response:**
```json
{
  "analysis": "Based on analyzing 847 open issues, here are the key themes..."
}
```

### GET /health

Health check endpoint.

---

## Storage Choice: SQLite

I chose **SQLite** with Drizzle ORM for the following reasons:

1. **Persistence** - Data survives server restarts (unlike in-memory)
2. **Performance** - Fast queries with indexed lookups by repo
3. **Simplicity** - Zero configuration, single file database
4. **Type Safety** - Drizzle ORM provides TypeScript types for all queries

Alternatives considered as per requirement document:
- **In-memory**: Too volatile, loses data on restart
- **JSON file**: No query capabilities, slow for large datasets

---

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite + Drizzle ORM
- **LLM**: Google Gemini 2.0 Flash or Others (@google/genai)
- **HTTP Client**: Axios

## Project Structure

```
src/
├── index.ts          # Express server entry point
├── routes/
│   └── api.ts        # /scan and /analyze endpoints
├── services/
│   ├── github.ts     # GitHub API integration
│   └── cache.ts      # SQLite operations
├── llm/
│   ├── client.ts     # Gemini client config
│   ├── prompts.ts    # System prompts & templates
│   └── analyzer.ts   # Issue analysis logic
└── db/
    ├── schema.ts     # Drizzle schema
    └── index.ts      # Database connection
```

## Scripts

```bash
npm run dev    # Start development server with ts-node
npm run build  # Compile TypeScript to dist/
npm start      # Run compiled production build
```

