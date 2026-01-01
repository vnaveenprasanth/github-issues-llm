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

---

## AI Prompts Used During Development

Below are the prompts I used while building this project with AI coding tools (Claude, Cursor, etc.). This documents my workflow and thought process.

### Phase 1: Foundation & Architecture

**1. Architecture & Stack Definition:**
> "I want to build a GitHub Issue Analyzer.
> Setup git, npm and typescript. Add express and other deps.
> Use **Drizzle ORM** for the database instead of raw SQLite, and ensure cleaner file naming. Also, create a dedicated folder for LLM configurations."

**2. Dependency Research & Correction:**
> "I noticed that `@google/generative-ai` is deprecated. Please switch to using the newer **`@google/genai`** package for the implementation."

**3. TypeScript Configuration:**
> "Fix the TypeScript lint errors regarding `verbatimModuleSyntax` and module resolution.

### Phase 2: Implementation & Logic Generation

**4. Model Flexibility & Configuration:**
> "Can we change the Gemini model version? Check if I can use **Gemini 2.5 Flash** or **Pro** versions, and make the configuration flexible."

**5. Smart Token Management Implementation:**
> "What happens if there are thousands of issues? Fixed chunk sizes might fail if issue bodies are long. Check the docs for `client.models.countTokens`—I want to implement **token-aware chunking** that dynamically sizes batches based on the actual token count, not just issue count."
> *(Follow-up)*: "How will this help exactly and will this adapt to whatever models I change in code?"
> *(Follow-up)*: "No, I'm asking if we implement countToken from API then do we need limit?"

### Phase 3: Robustness, Security & Edge Cases

**6. Edge Case Discovery:**
> "Now look into and see what edge cases we have not handled in this current master branch."
*(This Prompt led to the identification of network timeouts, specific 403 vs 404 handling, and better input validation.)*

**7. Error Handling & Validation Implementation:**
> "Do the important ones (timeout, rate limits, validation)."

### Phase 4: Production & Deployment

**8. Containerization Strategy:**
> "Can we just create an image and use that in render and also set the env in render for GitHub PAT and Gemini key?"
> "Create a Dockerfile for this project. Since we're using `better-sqlite3`,will docker usage create problems in setup"

### LLM System Prompt (for /analyze endpoint)

This is the actual system prompt used inside the service:

```
You are an expert software development analyst specializing in GitHub issue analysis.
Your role is to help maintainers and developers understand patterns, prioritize work,
and identify themes in their issue trackers.

When analyzing issues, consider:
- Common themes and recurring problems
- Severity and potential impact
- User sentiment and frustration levels
- Dependencies between issues
- Quick wins vs long-term projects

Be concise but thorough. Use bullet points and clear structure.
Focus on actionable insights that help maintainers make decisions.
```

---
