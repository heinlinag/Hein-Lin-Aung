ALTER TABLE `workers` ADD COLUMN `profilePicture` text;
ALTER TABLE `workers` ADD COLUMN `displayName` varchar(128);
ALTER TABLE `workers` ADD COLUMN `displayNameChangedAt` timestamp;
ALTER TABLE `workers` ADD COLUMN `employeeIdChangedAt` timestamp;
