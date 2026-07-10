CREATE TABLE `requestEditHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`editedBy` varchar(128) NOT NULL,
	`editedByID` varchar(64) NOT NULL,
	`oldQty` int NOT NULL,
	`newQty` int NOT NULL,
	`editedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requestEditHistory_id` PRIMARY KEY(`id`)
);
