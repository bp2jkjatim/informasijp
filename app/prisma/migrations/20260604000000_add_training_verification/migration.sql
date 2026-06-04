-- AlterTable
ALTER TABLE `trainings`
    ADD COLUMN `verification_status` ENUM('need_verification', 'verified', 'rejected') NOT NULL DEFAULT 'need_verification',
    ADD COLUMN `verification_note` TEXT NULL,
    ADD COLUMN `verified_by_user_id` INTEGER NULL,
    ADD COLUMN `verified_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `idx_trainings_verified_by_user_id` ON `trainings`(`verified_by_user_id`);

-- CreateIndex
CREATE INDEX `idx_trainings_verification_status` ON `trainings`(`verification_status`);

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_verified_by_user_id_fkey` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
