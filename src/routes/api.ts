import { Router, Request, Response } from 'express';
import { fetchOpenIssues, isValidRepoFormat } from '../services/github';
import { saveIssues, getIssues, hasIssues } from '../services/cache';

const router = Router();

/**
 * POST /scan
 * Fetch all open issues from a GitHub repository and cache them locally
 */
router.post('/scan', async (req: Request, res: Response) => {
    try {
        const { repo } = req.body;

        // Validate request
        if (!repo) {
            return res.status(400).json({
                error: 'Missing required field: repo',
                example: { repo: 'owner/repository-name' }
            });
        }

        if (!isValidRepoFormat(repo)) {
            return res.status(400).json({
                error: 'Invalid repo format. Expected: owner/repository-name',
                received: repo
            });
        }

        console.log(`🔍 Scanning repository: ${repo}`);

        // Fetch issues from GitHub
        const issues = await fetchOpenIssues(repo);

        // Save to cache
        const savedCount = await saveIssues(repo, issues);

        console.log(`✅ Cached ${savedCount} issues for ${repo}`);

        return res.json({
            repo,
            issues_fetched: savedCount,
            cached_successfully: true
        });

    } catch (error: any) {
        console.error('❌ Scan error:', error.message);

        // Handle timeout
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return res.status(504).json({
                error: 'Request timeout',
                message: 'GitHub API took too long to respond. Try again later.',
            });
        }

        // Handle GitHub API errors
        if (error.response?.status === 404) {
            return res.status(404).json({
                error: 'Repository not found',
                repo: req.body.repo,
                hint: 'Check if the repository exists and is spelled correctly'
            });
        }

        if (error.response?.status === 401) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid or expired GitHub token. Check your GITHUB_TOKEN.',
            });
        }

        if (error.response?.status === 403) {
            const rateLimitRemaining = error.response?.headers?.['x-ratelimit-remaining'];
            const isRateLimit = rateLimitRemaining === '0';

            return res.status(403).json({
                error: isRateLimit
                    ? 'GitHub API rate limit exceeded'
                    : 'Access forbidden - repository may be private',
                hint: isRateLimit
                    ? 'Wait an hour or add GITHUB_TOKEN for higher limits (5000/hr)'
                    : 'Add a GITHUB_TOKEN with repo access to scan private repos',
            });
        }

        return res.status(500).json({
            error: 'Failed to scan repository',
            message: error.message
        });
    }
});

/**
 * POST /analyze
 * Analyze cached issues for a repo using LLM
 */
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { repo, prompt } = req.body;

        // Validate request
        if (!repo) {
            return res.status(400).json({
                error: 'Missing required field: repo',
                example: { repo: 'owner/repository-name', prompt: 'Analyze these issues' }
            });
        }

        if (!prompt) {
            return res.status(400).json({
                error: 'Missing required field: prompt',
                example: { repo: 'owner/repository-name', prompt: 'Find common themes and recommend priorities' }
            });
        }

        // Validate prompt is not empty or too short
        const trimmedPrompt = prompt.trim();
        if (trimmedPrompt.length < 5) {
            return res.status(400).json({
                error: 'Prompt is too short',
                hint: 'Please provide a meaningful prompt (at least 5 characters)',
            });
        }

        // Validate prompt length (prevent abuse)
        if (trimmedPrompt.length > 5000) {
            return res.status(400).json({
                error: 'Prompt is too long',
                hint: 'Please keep your prompt under 5000 characters',
            });
        }

        // Check if repo has been scanned
        const hasCachedIssues = await hasIssues(repo);
        if (!hasCachedIssues) {
            return res.status(404).json({
                error: 'Repository has not been scanned yet',
                repo,
                hint: 'Please call POST /scan first to fetch and cache issues'
            });
        }

        // Get cached issues
        const issues = await getIssues(repo);

        if (issues.length === 0) {
            return res.json({
                analysis: 'No open issues found in this repository. The repository appears to be well-maintained with no pending issues!'
            });
        }

        console.log(`🤖 Analyzing ${issues.length} issues for ${repo}...`);

        // Analyze with LLM
        const { analyzeIssues } = await import('../llm/analyzer');
        const analysis = await analyzeIssues(issues, trimmedPrompt);

        console.log(`✅ Analysis complete for ${repo}`);

        return res.json({ analysis });

    } catch (error: any) {
        console.error('❌ Analysis error:', error.message);

        // Handle Gemini API errors
        if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
            return res.status(500).json({
                error: 'Gemini API key is missing or invalid',
                hint: 'Set GEMINI_API_KEY environment variable'
            });
        }

        // Handle rate limiting (429)
        if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
            return res.status(429).json({
                error: 'Gemini API rate limit exceeded',
                hint: 'Wait a minute and try again, or upgrade your API plan',
            });
        }

        // Handle content safety blocks
        if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
            return res.status(400).json({
                error: 'Content was blocked by safety filters',
                hint: 'Try rephrasing your prompt or the issues may contain flagged content',
            });
        }

        return res.status(500).json({
            error: 'Failed to analyze issues',
            message: error.message
        });
    }
});

export default router;
