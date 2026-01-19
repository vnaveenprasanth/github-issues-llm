/**
 * LLM Prompts and Templates
 * Configurable system prompts for issue analysis
 */

export const SYSTEM_PROMPT = `You are an expert software development analyst specializing in GitHub issue analysis. 
Your role is to help maintainers and developers understand patterns, prioritize work, and identify themes in their issue trackers.

When analyzing issues, consider:
- Common themes and recurring problems
- Severity and potential impact
- User sentiment and frustration levels
- Dependencies between issues
- Quick wins vs long-term projects

Be concise but thorough. Use bullet points and clear structure in your responses.
Focus on actionable insights that help maintainers make decisions.`;

/**
 * Build the analysis prompt combining user prompt with issue data
 */
export function buildAnalysisPrompt(
    issues: Array<{ title: string; body: string | null; labels: string; createdAt: string; comments: number }>,
    userPrompt: string
): string {
    // Format issues for context
    const issueContext = issues.map((issue, index) => {
        const labels = issue.labels ? JSON.parse(issue.labels).map((l: any) => l.name).join(', ') : 'none';
        return `
Issue #${index + 1}:
- Title: ${issue.title}
- Labels: ${labels}
---`;
    }).join('\n');

    return `
## GitHub Issues Data

Below are ${issues.length} open issues from a GitHub repository:

${issueContext}

## Analysis Request

${userPrompt}

Please provide a comprehensive analysis based on the issues above.`;
}

/**
 * Build a summary prompt for when there are too many issues
 */
export function buildChunkedPrompt(
    summaries: string[],
    userPrompt: string
): string {
    return `
## Aggregated Issue Summaries

The following are summaries from analyzing multiple batches of issues:

${summaries.map((s, i) => `Batch ${i + 1}:\n${s}`).join('\n\n')}

## Final Analysis Request

${userPrompt}

Please synthesize the above summaries into a comprehensive final analysis.`;
}


// - Created: ${issue.createdAt}
// - Comments: ${issue.comments}
// - Description: ${issue.body ? issue.body.slice(0, 500) : 'No description'}