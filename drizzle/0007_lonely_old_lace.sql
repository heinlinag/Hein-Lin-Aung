CREATE TABLE `pendingRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('delete','used_update') NOT NULL,
	`orderId` int NOT NULL,
	`orderSnapshot` text NOT NULL,
	`requestedBy` varchar(64) NOT NULL,
	`workerName` varchar(128) NOT NULL,
	`actionData` text,
	`status` enum('pending','approved','cancelled') NOT NULL DEFAULT 'pending',
	`reviewedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `pendingRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `workers` ADD `userLevel` enum('1','2') DEFAULT '2' NOT NULL;