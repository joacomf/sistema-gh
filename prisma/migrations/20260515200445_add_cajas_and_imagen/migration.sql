-- AlterTable
ALTER TABLE `Stock` ADD COLUMN `imagen` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `Caja` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `ubicacion` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockCaja` (
    `stockId` VARCHAR(191) NOT NULL,
    `cajaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`stockId`, `cajaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StockCaja` ADD CONSTRAINT `StockCaja_stockId_fkey` FOREIGN KEY (`stockId`) REFERENCES `Stock`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockCaja` ADD CONSTRAINT `StockCaja_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `Caja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
