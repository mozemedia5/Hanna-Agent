CREATE TABLE `workspaceSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` varchar(16) NOT NULL DEFAULT 'light',
	`defaultProvider` varchar(64) NOT NULL DEFAULT 'automatic',
	`autoRouting` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaceSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `workspaceSettings` ADD CONSTRAINT `workspaceSettings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;