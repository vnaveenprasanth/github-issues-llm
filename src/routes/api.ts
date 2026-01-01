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

        // Handle GitHub API errors
        if (error.response?.status === 404) {
            return res.status(404).json({
                error: 'Repository not found',
                repo: req.body.repo
            });
        }

        if (error.response?.status === 403) {
            return res.status(403).json({
                error: 'GitHub API rate limit exceeded. Try again later or add GITHUB_TOKEN.',
            });
        }

        return res.status(500).json({
            error: 'Failed to scan repository',
            message: error.message
        });
    }
});

export default router;
