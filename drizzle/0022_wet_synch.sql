CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','warning','success','error') NOT NULL DEFAULT 'info',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appNotifications` MODIFY COLUMN `readBy` varchar(2000) NOT NULL DEFAULT '';