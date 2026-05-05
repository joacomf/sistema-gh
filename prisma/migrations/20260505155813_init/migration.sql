-- CreateTable
CREATE TABLE `Proveedor` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DescuentoProveedor` (
    `id` VARCHAR(191) NOT NULL,
    `proveedorId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `porcentaje` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stock` (
    `id` VARCHAR(191) NOT NULL,
    `proveedorId` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(100) NOT NULL,
    `codigoOriginal` VARCHAR(100) NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 0,
    `cantidadCritica` INTEGER NOT NULL DEFAULT 0,
    `cantidadSugerida` INTEGER NOT NULL DEFAULT 0,
    `fechaPedido` DATETIME(3) NULL,
    `fechaRecibido` DATETIME(3) NULL,
    `precioCosto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `precioLista` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `precioVenta` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DescuentoProveedor` ADD CONSTRAINT `DescuentoProveedor_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
