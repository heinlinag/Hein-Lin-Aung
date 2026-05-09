CREATE TABLE `qrScanLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`scannedBy` varchar(64) NOT NULL,
	`scannedByName` varchar(128) NOT NULL,
	`action` enum('scan','balance_update') NOT NULL DEFAULT 'scan',
	`oldQty` int,
	`newQty` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qrScanLog_id` PRIMARY KEY(`id`)
);
