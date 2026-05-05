ALTER TABLE `workers` MODIFY COLUMN `userLevel` enum('1','1.1','2') NOT NULL DEFAULT '2';--> statement-breakpoint
ALTER TABLE `pendingRequests` ADD `processApprovedQty` int;--> statement-breakpoint
ALTER TABLE `pendingRequests` ADD `processApprovedBy` varchar(128);--> statement-breakpoint
ALTER TABLE `pendingRequests` ADD `processApprovedAt` timestamp;