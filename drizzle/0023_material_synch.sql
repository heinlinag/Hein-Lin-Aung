CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationID` int NOT NULL,
	`senderID` varchar(64) NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`worker1ID` varchar(64) NOT NULL,
	`worker2ID` varchar(64) NOT NULL,
	`orderRef` varchar(64),
	`orderLabel` varchar(255),
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
