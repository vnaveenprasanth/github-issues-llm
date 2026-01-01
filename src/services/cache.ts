import { db, sqlite } from '../db';
import { issues, NewIssue, Issue } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Save issues to the database for a specific repo
 * Clears existing issues for the repo before inserting new ones
 */
export async function saveIssues(repo: string, issueList: NewIssue[]): Promise<number> {
    // Clear existing issues for this repo
    await clearIssues(repo);

    if (issueList.length === 0) {
        return 0;
    }

    // Insert new issues
    db.insert(issues).values(issueList).run();

    return issueList.length;
}

/**
 * Get all cached issues for a specific repo
 */
export async function getIssues(repo: string): Promise<Issue[]> {
    return db.select().from(issues).where(eq(issues.repo, repo)).all();
}

/**
 * Clear all issues for a specific repo
 */
export async function clearIssues(repo: string): Promise<void> {
    db.delete(issues).where(eq(issues.repo, repo)).run();
}

/**
 * Check if a repo has been scanned (has cached issues)
 */
export async function hasIssues(repo: string): Promise<boolean> {
    const result = db.select().from(issues).where(eq(issues.repo, repo)).limit(1).all();
    return result.length > 0;
}

/**
 * Get count of issues for a repo
 */
export async function getIssueCount(repo: string): Promise<number> {
    const result = db.select().from(issues).where(eq(issues.repo, repo)).all();
    return result.length;
}
