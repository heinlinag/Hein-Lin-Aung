CREATE TABLE `appNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('order_request','order_approved','order_cancelled','order_in_process','order_deleted','out_of_stock','new_order','login','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`orderID` varchar(64),
	`productionOrder` varchar(64),
	`jobNo` varchar(64),
	`qty` int,
	`fluteType` varchar(64),
	`workerID` varchar(64),
	`workerName` varchar(128),
	`trackingId` varchar(64),
	`readBy` text NOT NULL DEFAULT (''),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appNotifications_id` PRIMARY KEY(`id`)
);
