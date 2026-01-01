import { getClient, LLM_CONFIG, CONTEXT_LIMITS } from './client';
import { SYSTEM_PROMPT, buildAnalysisPrompt, buildChunkedPrompt } from './prompts';
import { Issue } from '../db/schema';

/**
 * Analyze issues using Gemini LLM
 * Handles chunking for large issue sets
 */
export async function analyzeIssues(issues: Issue[], userPrompt: string): Promise<string> {
    const client = getClient();

    // Check if we need to chunk
    if (issues.length <= CONTEXT_LIMITS.maxIssuesPerChunk) {
        // Single analysis
        return await analyzeSingleBatch(client, issues, userPrompt);
    } else {
        // Chunked analysis for large issue sets
        return await analyzeChunked(client, issues, userPrompt);
    }
}

/**
 * Analyze a single batch of issues
 */
async function analyzeSingleBatch(
    client: any,
    issues: Issue[],
    userPrompt: string
): Promise<string> {
    const prompt = buildAnalysisPrompt(
        issues.map(i => ({
            title: i.title,
            body: i.body,
            labels: i.labels || '[]',
            createdAt: i.createdAt,
            comments: i.comments || 0,
        })),
        userPrompt
    );

    const response = await client.models.generateContent({
        model: LLM_CONFIG.model,
        contents: prompt,
        config: {
            maxOutputTokens: LLM_CONFIG.maxOutputTokens,
            temperature: LLM_CONFIG.temperature,
            systemInstruction: SYSTEM_PROMPT,
        },
    });

    return response.text || '';
}

/**
 * Analyze issues in chunks and synthesize
 */
async function analyzeChunked(
    client: any,
    issues: Issue[],
    userPrompt: string
): Promise<string> {
    const chunks: Issue[][] = [];

    // Split into chunks
    for (let i = 0; i < issues.length; i += CONTEXT_LIMITS.maxIssuesPerChunk) {
        chunks.push(issues.slice(i, i + CONTEXT_LIMITS.maxIssuesPerChunk));
    }

    console.log(`📊 Analyzing ${issues.length} issues in ${chunks.length} chunks...`);

    // Analyze each chunk with a summary prompt
    const summaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
        console.log(`   Processing chunk ${i + 1}/${chunks.length}...`);
        const summary = await analyzeSingleBatch(
            client,
            chunks[i],
            `Summarize the key themes, patterns, and notable issues in this batch. Be concise.`
        );
        summaries.push(summary);
    }

    // Synthesize all summaries
    console.log(`   Synthesizing final analysis...`);
    const finalPrompt = buildChunkedPrompt(summaries, userPrompt);

    const response = await client.models.generateContent({
        model: LLM_CONFIG.model,
        contents: finalPrompt,
        config: {
            maxOutputTokens: LLM_CONFIG.maxOutputTokens,
            temperature: LLM_CONFIG.temperature,
            systemInstruction: SYSTEM_PROMPT,
        },
    });

    return response.text || '';
}

/**
 * Test LLM connection
 */
export async function testConnection(): Promise<boolean> {
    try {
        const client = getClient();
        await client.models.generateContent({
            model: LLM_CONFIG.model,
            contents: 'Hello',
        });
        return true;
    } catch (error) {
        return false;
    }
}
