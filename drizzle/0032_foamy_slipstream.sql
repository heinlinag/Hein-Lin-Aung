ALTER TABLE `chatMessages` ADD `replyToID` int;--> statement-breakpoint
ALTER TABLE `chatMessages` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `replyToID` int;--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `workers` ADD `lastSeenAt` timestamp;