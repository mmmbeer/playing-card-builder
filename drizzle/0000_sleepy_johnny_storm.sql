CREATE TABLE `bug_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`summary` text NOT NULL,
	`happened` text NOT NULL,
	`steps` text NOT NULL,
	`details` text,
	`app_state` text
);
