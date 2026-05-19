CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`workerID` varchar(64),
	`orderId` varchar(64),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(128),
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`type` enum('maintenance','alert','update','notification') NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceSchedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenanceSchedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`responseTime` int NOT NULL,
	`requestCount` int NOT NULL,
	`errorCount` int NOT NULL DEFAULT 0,
	`cpuUsage` varchar(10),
	`memoryUsage` varchar(10),
	`databaseLatency` int,
	`status` enum('operational','degraded','down') NOT NULL DEFAULT 'operational',
	CONSTRAINT `systemMetrics_id` PRIMARY KEY(`id`)
);
