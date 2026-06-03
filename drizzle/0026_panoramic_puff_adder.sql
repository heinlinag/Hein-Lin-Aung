CREATE TABLE `groupMessageReads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupMessageID` int NOT NULL,
	`workerID` varchar(64) NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupMessageReads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageType` enum('dm','group') NOT NULL,
	`messageID` int NOT NULL,
	`workerID` varchar(64) NOT NULL,
	`emoji` varchar(8) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageReactions_id` PRIMARY KEY(`id`)
);
