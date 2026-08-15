import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const bugReports = sqliteTable("bug_reports", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  summary: text("summary").notNull(),
  happened: text("happened").notNull(),
  steps: text("steps").notNull(),
  details: text("details"),
  appState: text("app_state"),
});
