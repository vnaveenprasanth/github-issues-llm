import { GoogleGenAI } from '@google/genai';

// Lazy initialization of Gemini client
let genAI: GoogleGenAI | null = null;

/**
 * Get or create the Gemini client
 */
export function getClient(): GoogleGenAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        genAI = new GoogleGenAI({ apiKey });
    }

    return genAI;
}

/**
 * LLM Configuration
 */
export const LLM_CONFIG = {
    model: 'gemini-2.0-flash',
    maxOutputTokens: 2048,
    temperature: 0.7,
};

/**
 * Context limits for chunking
 */
export const CONTEXT_LIMITS = {
    maxIssuesPerChunk: 50,
    maxBodyLength: 500,
};
