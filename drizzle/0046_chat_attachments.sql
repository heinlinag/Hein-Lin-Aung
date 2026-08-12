CREATE TABLE `chatAttachments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `messageType` enum('dm','group') NOT NULL,
  `messageID` int NOT NULL,
  `storageKey` varchar(512) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `mimeType` varchar(128) NOT NULL,
  `sizeBytes` int NOT NULL,
  `uploadedBy` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `chatAttachments_id` PRIMARY KEY(`id`)
);
