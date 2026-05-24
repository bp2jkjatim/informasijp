import { getDbPool } from '../db.js'

const sql = `
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
GROUP BY e.id, e.nip, e.name, e.jp_target
`

try {
  const db = getDbPool()
  await db.query(sql)
  console.log('employee_yearly_summary view refreshed')
  process.exit(0)
} catch (error) {
  console.error('Failed to refresh employee_yearly_summary view')
  console.error(error)
  process.exit(1)
}
