import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Database file path
const DB_PATH = path.join(process.cwd(), 'issues.db');

// Create SQLite database connection
const sqlite = new Database(DB_PATH);

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Initialize database tables
export function initializeDatabase() {
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY,
      number INTEGER NOT NULL,
      repo TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      html_url TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      author_login TEXT,
      labels TEXT,
      comments INTEGER DEFAULT 0,
      assignees TEXT
    )
  `);

    // Create index for faster repo lookups
    sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_issues_repo ON issues(repo)
  `);

    console.log('📦 Database initialized');
}

export { sqlite };
