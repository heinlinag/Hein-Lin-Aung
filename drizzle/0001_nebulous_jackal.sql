CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderID` varchar(64) NOT NULL,
	`fluteType` varchar(64) NOT NULL,
	`sizeW` int NOT NULL,
	`sizeL` int NOT NULL,
	`qty` int NOT NULL,
	`bqComment` text NOT NULL,
	`status` enum('current','out_of_stock') NOT NULL DEFAULT 'current',
	`submittedBy` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerID` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`department` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workers_id` PRIMARY KEY(`id`),
	CONSTRAINT `workers_workerID_unique` UNIQUE(`workerID`)
);
