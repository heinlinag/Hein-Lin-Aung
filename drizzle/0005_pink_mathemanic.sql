CREATE TABLE `usageHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobNo` varchar(8),
	`usedQty` int NOT NULL,
	`orderID` varchar(64) NOT NULL,
	`fluteType` varchar(64) NOT NULL,
	`bqComment` text NOT NULL,
	`purpose` enum('job','old_stock') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usageHistory_id` PRIMARY KEY(`id`)
);
