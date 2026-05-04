ALTER TABLE `approvalActionLog` MODIFY COLUMN `actionType` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `approvalActionLog` ADD `details` text;