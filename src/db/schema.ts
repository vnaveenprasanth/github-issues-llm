import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Issues table schema
export const issues = sqliteTable('issues', {
    id: integer('id').primaryKey(),
    number: integer('number').notNull(),
    repo: text('repo').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    htmlUrl: text('html_url').notNull(),
    state: text('state').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    authorLogin: text('author_login'),
    labels: text('labels'), // JSON string of labels
    comments: integer('comments').default(0),
    assignees: text('assignees'), // JSON string of assignees
});

// Type inference
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
