-- CreateTable
CREATE TABLE `supporting_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `period_month` INTEGER NOT NULL,
    `period_year` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `file_original_name` TEXT NOT NULL,
    `file_stored_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(191) NULL,
    `created_by_user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_supporting_documents_period`(`employee_id`, `period_year`, `period_month`),
    INDEX `idx_supporting_documents_created_by`(`created_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supporting_document_period_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `period_month` INTEGER NOT NULL,
    `period_year` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `reviewed_by_user_id` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_supporting_document_period_reviews_reviewer`(`reviewed_by_user_id`),
    UNIQUE INDEX `uniq_supporting_document_period_review`(`employee_id`, `period_year`, `period_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `supporting_documents` ADD CONSTRAINT `supporting_documents_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supporting_documents` ADD CONSTRAINT `supporting_documents_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supporting_document_period_reviews` ADD CONSTRAINT `supporting_document_period_reviews_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supporting_document_period_reviews` ADD CONSTRAINT `supporting_document_period_reviews_reviewed_by_user_id_fkey` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
