CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nip VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NULL,
  employee_status ENUM('PNS', 'P3K', 'LAINNYA') NOT NULL DEFAULT 'PNS',
  position_level VARCHAR(255) NULL,
  rank_group VARCHAR(255) NULL,
  tmt_rank VARCHAR(64) NULL,
  tmt_position VARCHAR(64) NULL,
  akumulasi_ak_2025 DECIMAL(12,3) NULL,
  notes TEXT NULL,
  jp_target DECIMAL(8,2) NOT NULL DEFAULT 20.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_nip (nip)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'leader', 'kepala_balai', 'ktu', 'user') NOT NULL,
  employee_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_employee_id (employee_id),
  CONSTRAINT fk_users_employee_id FOREIGN KEY (employee_id) REFERENCES employees (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS trainings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  proposed_training TEXT NULL,
  training_name VARCHAR(255) NOT NULL,
  training_date_text VARCHAR(255) NULL,
  training_provider VARCHAR(255) NULL,
  certificate_number VARCHAR(255) NULL,
  certificate_file_path VARCHAR(255) NULL,
  certificate_link VARCHAR(255) NULL,
  is_pbj TINYINT(1) NOT NULL DEFAULT 0,
  is_jabatan TINYINT(1) NOT NULL DEFAULT 0,
  is_integritas TINYINT(1) NOT NULL DEFAULT 0,
  jumlah_jp DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  year SMALLINT UNSIGNED NOT NULL DEFAULT 2025,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trainings_employee_year (employee_id, year),
  KEY idx_trainings_created_by_user_id (created_by_user_id),
  CONSTRAINT fk_trainings_employee_id FOREIGN KEY (employee_id) REFERENCES employees (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_trainings_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS system_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(128) NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_system_settings_key (setting_key)
);

INSERT INTO system_settings (setting_key, setting_value)
VALUES
  ('jp_target_pns', '20'),
  ('jp_target_p3k', '0')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_at = CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW employee_yearly_summary AS
SELECT
  e.id AS employee_id,
  e.nip,
  e.name,
  2025 AS year,
  COALESCE(SUM(t.jumlah_jp), 0) AS total_jp,
  e.jp_target,
  CASE WHEN COALESCE(SUM(t.jumlah_jp), 0) >= e.jp_target THEN 1 ELSE 0 END AS jp_fulfilled,
  MAX(COALESCE(t.is_pbj, 0)) AS has_pbj,
  MAX(COALESCE(t.is_jabatan, 0)) AS has_jabatan,
  MAX(COALESCE(t.is_integritas, 0)) AS has_integritas,
  CASE
    WHEN MAX(COALESCE(t.is_pbj, 0)) = 1
      AND MAX(COALESCE(t.is_jabatan, 0)) = 1
      AND MAX(COALESCE(t.is_integritas, 0)) = 1
    THEN 1 ELSE 0
  END AS criteria_completed,
  CASE
    WHEN COALESCE(SUM(t.jumlah_jp), 0) >= e.jp_target
      AND MAX(COALESCE(t.is_pbj, 0)) = 1
      AND MAX(COALESCE(t.is_jabatan, 0)) = 1
      AND MAX(COALESCE(t.is_integritas, 0)) = 1
    THEN 1 ELSE 0
  END AS overall_completed
FROM employees e
LEFT JOIN trainings t ON t.employee_id = e.id AND t.year = 2025
GROUP BY e.id, e.nip, e.name, e.jp_target;
