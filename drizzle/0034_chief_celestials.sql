ALTER TABLE `workers` ADD `activeDeviceToken` varchar(128);--> statement-breakpoint
ALTER TABLE `workers` ADD `activeDeviceName` varchar(256);--> statement-breakpoint
ALTER TABLE `workers` ADD `activeDeviceIP` varchar(64);--> statement-breakpoint
ALTER TABLE `workers` ADD `activeLoginAt` timestamp;