CREATE TABLE `approvalActionLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionType` enum('approve','cancel') NOT NULL,
	`requestId` int NOT NULL,
	`requestType` enum('delete','used_update') NOT NULL,
	`orderID` varchar(64) NOT NULL,
	`requestedBy` varchar(128) NOT NULL,
	`reviewedBy` varchar(128) NOT NULL,
	`approvedQty` int,
	`requestedQty` int,
	`cancelReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalActionLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pendingRequests` ADD `cancelReason` text;--> statement-breakpoint
ALTER TABLE `pendingRequests` ADD `approvedQty` int;