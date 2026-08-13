ALTER TABLE `orders` ADD COLUMN `initialQty` INT NULL AFTER `qty`;
UPDATE `orders` o
LEFT JOIN (
  SELECT `orderID`, SUM(`usedQty`) AS `totalUsedQty`
  FROM `usageHistory`
  GROUP BY `orderID`
) u ON u.`orderID` = o.`orderID`
LEFT JOIN (
  SELECT `orderId`, SUM(`newQty` - `oldQty`) AS `totalAdjustmentQty`
  FROM `qrScanLog`
  WHERE `action` = 'balance_update' AND `oldQty` IS NOT NULL AND `newQty` IS NOT NULL
  GROUP BY `orderId`
) a ON a.`orderId` = o.`orderID`
SET o.`initialQty` = GREATEST(0, o.`qty` + COALESCE(u.`totalUsedQty`, 0) - COALESCE(a.`totalAdjustmentQty`, 0))
WHERE o.`initialQty` IS NULL;
ALTER TABLE `orders` MODIFY COLUMN `initialQty` INT NOT NULL;
