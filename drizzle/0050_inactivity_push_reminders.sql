CREATE TABLE `inactivityReminderDeliveries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workerID` varchar(64) NOT NULL,
  `thresholdDays` int NOT NULL,
  `activityAt` timestamp NOT NULL,
  `sentAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inactivityReminderDeliveries_worker_threshold_activity_unique` (`workerID`,`thresholdDays`,`activityAt`),
  KEY `inactivityReminderDeliveries_worker_idx` (`workerID`)
);
