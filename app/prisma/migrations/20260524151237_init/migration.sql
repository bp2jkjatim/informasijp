-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'leader', 'kepala_balai', 'ktu', 'user') NOT NULL DEFAULT 'user',
    `employee_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_employee_id_key`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nip` VARCHAR(50) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `job_title` VARCHAR(191) NULL,
    `phone` VARCHAR(50) NULL,
    `employment_state` VARCHAR(50) NULL,
    `employee_status` ENUM('PNS', 'P3K', 'LAINNYA') NOT NULL DEFAULT 'LAINNYA',
    `position_level` VARCHAR(100) NULL,
    `rank_group` VARCHAR(100) NULL,
    `tmt_rank` DATE NULL,
    `tmt_position` DATE NULL,
    `akumulasi_ak_2025` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `jp_target` INTEGER NOT NULL DEFAULT 20,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_nip_key`(`nip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `proposed_training` TEXT NULL,
    `training_name` VARCHAR(191) NOT NULL,
    `training_date_text` VARCHAR(100) NULL,
    `training_provider` VARCHAR(191) NULL,
    `certificate_number` VARCHAR(191) NULL,
    `certificate_file_path` VARCHAR(255) NULL,
    `certificate_link` VARCHAR(255) NULL,
    `is_pbj` BOOLEAN NOT NULL DEFAULT false,
    `is_jabatan` BOOLEAN NOT NULL DEFAULT false,
    `is_integritas` BOOLEAN NOT NULL DEFAULT false,
    `jumlah_jp` DECIMAL(10, 2) NOT NULL,
    `year` INTEGER NOT NULL,
    `created_by_user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_trainings_employee_id`(`employee_id`),
    INDEX `idx_trainings_year`(`year`),
    INDEX `idx_trainings_created_by_user_id`(`created_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
