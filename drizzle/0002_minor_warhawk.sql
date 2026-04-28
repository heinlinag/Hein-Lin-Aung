CREATE TABLE `deletedLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderID` varchar(64) NOT NULL,
	`fluteType` varchar(64) NOT NULL,
	`sizeW` int NOT NULL,
	`sizeL` int NOT NULL,
	`qty` int NOT NULL,
	`bqComment` text NOT NULL,
	`deletedBy` varchar(64) NOT NULL,
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deletedLogs_id` PRIMARY KEY(`id`)
);
