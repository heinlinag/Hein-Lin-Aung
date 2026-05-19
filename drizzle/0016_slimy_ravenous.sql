CREATE TABLE `maintenanceSchedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`impact` enum('none','minor','major','critical') NOT NULL DEFAULT 'minor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenanceSchedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cpuUsage` varchar(10) NOT NULL DEFAULT '0',
	`memoryUsage` varchar(10) NOT NULL DEFAULT '0',
	`diskUsage` varchar(10) NOT NULL DEFAULT '0',
	`activeConnections` int NOT NULL DEFAULT 0,
	`requestsPerSecond` varchar(10) NOT NULL DEFAULT '0',
	`avgResponseTime` int NOT NULL DEFAULT 0,
	`errorRate` varchar(10) NOT NULL DEFAULT '0',
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('operational','degraded','maintenance','down') NOT NULL DEFAULT 'operational',
	`uptime` varchar(10) NOT NULL DEFAULT '99.99',
	`avgResponseTime` int NOT NULL DEFAULT 0,
	`lastCheckedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemStatus_id` PRIMARY KEY(`id`)
);
