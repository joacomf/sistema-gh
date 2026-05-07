-- CreateTable
CREATE TABLE `RepuestoPedido` (
    `id` VARCHAR(191) NOT NULL,
    `stockId` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `fechaPedido` DATETIME(3) NULL,
    `fechaRecibido` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Factura` (
    `id` VARCHAR(191) NOT NULL,
    `proveedorId` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(100) NOT NULL,
    `importe` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacturaItem` (
    `id` VARCHAR(191) NOT NULL,
    `facturaId` VARCHAR(191) NOT NULL,
    `stockId` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RepuestoPedido` ADD CONSTRAINT `RepuestoPedido_stockId_fkey` FOREIGN KEY (`stockId`) REFERENCES `Stock`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacturaItem` ADD CONSTRAINT `FacturaItem_facturaId_fkey` FOREIGN KEY (`facturaId`) REFERENCES `Factura`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacturaItem` ADD CONSTRAINT `FacturaItem_stockId_fkey` FOREIGN KEY (`stockId`) REFERENCES `Stock`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
