import axios from 'axios';
import { NewIssue } from '../db/schema';

const GITHUB_API_BASE = 'https://api.github.com';
const PER_PAGE = 100; // Max items per page

interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    state: string;
    created_at: string;
    updated_at: string;
    user: {
        login: string;
    } | null;
    labels: Array<{
        name: string;
        color: string;
    }>;
    comments: number;
    assignees: Array<{
        login: string;
    }>;
    pull_request?: object; // PRs also appear in issues endpoint
}

/**
 * Validate repo format (owner/repo)
 */
export function isValidRepoFormat(repo: string): boolean {
    const pattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
    return pattern.test(repo);
}

/**
 * Fetch all open issues from a GitHub repository
 * Handles pagination automatically
 */
export async function fetchOpenIssues(repo: string): Promise<NewIssue[]> {
    const [owner, repoName] = repo.split('/');
    const token = process.env.GITHUB_TOKEN;

    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const allIssues: NewIssue[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repoName}/issues`;

        const response = await axios.get<GitHubIssue[]>(url, {
            headers,
            params: {
                state: 'open',
                per_page: PER_PAGE,
                page,
                sort: 'created',
                direction: 'desc',
            },
        });

        const issues = response.data;

        // Filter out pull requests (they appear in issues endpoint too)
        const realIssues = issues.filter(issue => !issue.pull_request);

        // Transform to our schema
        const transformed = realIssues.map(issue => transformIssue(issue, repo));
        allIssues.push(...transformed);

        // Check if there are more pages
        if (issues.length < PER_PAGE) {
            hasMore = false;
        } else {
            page++;
        }

        // Log progress for large repos
        if (page > 1) {
            console.log(`📥 Fetched ${allIssues.length} issues so far...`);
        }
    }

    return allIssues;
}

/**
 * Transform GitHub API issue to our database schema
 */
function transformIssue(issue: GitHubIssue, repo: string): NewIssue {
    return {
        id: issue.id,
        number: issue.number,
        repo,
        title: issue.title,
        body: issue.body,
        htmlUrl: issue.html_url,
        state: issue.state,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        authorLogin: issue.user?.login || null,
        labels: JSON.stringify(issue.labels.map(l => ({ name: l.name, color: l.color }))),
        comments: issue.comments,
        assignees: JSON.stringify(issue.assignees.map(a => a.login)),
    };
}

/**
 * Check rate limit status
 */
export async function checkRateLimit(): Promise<{ remaining: number; limit: number; reset: Date }> {
    const token = process.env.GITHUB_TOKEN;

    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get(`${GITHUB_API_BASE}/rate_limit`, { headers });
    const { remaining, limit, reset } = response.data.rate;

    return {
        remaining,
        limit,
        reset: new Date(reset * 1000),
    };
}
