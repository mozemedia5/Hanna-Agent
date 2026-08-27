CREATE TABLE `providerCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`encryptedKey` text NOT NULL,
	`keyHint` varchar(12) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providerCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `providerCredentials_user_provider_idx` UNIQUE(`userId`,`provider`)
);
--> statement-breakpoint
ALTER TABLE `providerCredentials` ADD CONSTRAINT `providerCredentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;