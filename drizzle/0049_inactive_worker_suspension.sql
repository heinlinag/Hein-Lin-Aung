ALTER TABLE `workers`
  ADD COLUMN `accountStatus` enum('active','suspended') NOT NULL DEFAULT 'active',
  ADD COLUMN `lastLoginAt` timestamp NULL,
  ADD COLUMN `suspendedAt` timestamp NULL,
  ADD COLUMN `suspensionReason` varchar(255) NULL;

CREATE INDEX `workers_accountStatus_idx` ON `workers` (`accountStatus`);
CREATE INDEX `workers_lastLoginAt_idx` ON `workers` (`lastLoginAt`);
