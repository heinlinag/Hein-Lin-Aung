CREATE TABLE `customerSampleStockMovements` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sampleId` int NOT NULL,
  `orderId` int NOT NULL,
  `productionOrderID` varchar(64) NOT NULL,
  `customerName` varchar(256) NOT NULL,
  `sampleQty` int NOT NULL,
  `processedBy` varchar(128) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `customerSampleStockMovements_id` PRIMARY KEY(`id`),
  CONSTRAINT `customerSampleStockMovements_sample_unique` UNIQUE(`sampleId`)
);
CREATE INDEX `customerSampleStockMovements_order_created_idx` ON `customerSampleStockMovements` (`orderId`, `createdAt`);
