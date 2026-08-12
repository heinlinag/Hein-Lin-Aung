CREATE TABLE `chatTypingStates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `channelType` enum('dm','group') NOT NULL,
  `channelID` int NOT NULL,
  `workerID` varchar(64) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chatTypingStates_channel_worker_unique` (`channelType`,`channelID`,`workerID`),
  KEY `chatTypingStates_expiry_idx` (`expiresAt`)
);
