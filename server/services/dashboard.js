import { getDbPool } from '../db.js'
import { isPrivilegedRole } from '../auth.js'

export async function getDashboardSummaryForUser(user) {
  const db = getDbPool()

  if (isPrivilegedRole(user.role)) {
    const [summaryRows] = await db.query(
      `
        SELECT
          COUNT(*) AS total_employees,
          SUM(CASE WHEN jp_fulfilled = 1 THEN 1 ELSE 0 END) AS jp_fulfilled_count,
          SUM(CASE WHEN criteria_completed = 1 THEN 1 ELSE 0 END) AS criteria_completed_count,
          SUM(CASE WHEN overall_completed = 1 THEN 1 ELSE 0 END) AS overall_completed_count,
          SUM(total_jp) AS total_jp_all
        FROM employee_yearly_summary
        WHERE year = 2025
      `,
    )

    const [employees] = await db.query(
      `
        SELECT
          employee_id,
          nip,
          name,
          total_jp,
          jp_target,
          jp_fulfilled,
          has_pbj,
          has_jabatan,
          has_integritas,
          criteria_completed,
          overall_completed
        FROM employee_yearly_summary
        WHERE year = 2025
        ORDER BY name ASC
      `,
    )

    return {
      scope: 'all',
      summary: summaryRows[0],
      employees,
    }
  }

  const [summaryRows] = await db.query(
    `
      SELECT
        employee_id,
        nip,
        name,
        total_jp,
        jp_target,
        jp_fulfilled,
        has_pbj,
        has_jabatan,
        has_integritas,
        criteria_completed,
        overall_completed
      FROM employee_yearly_summary
      WHERE year = 2025 AND employee_id = ?
      LIMIT 1
    `,
    [user.employeeId],
  )

  return {
    scope: 'self',
    summary: summaryRows[0] || null,
    employees: summaryRows,
  }
}

export async function listEmployeesForUser(user) {
  const db = getDbPool()

  if (isPrivilegedRole(user.role)) {
    const [rows] = await db.query(
      `
        SELECT id, nip, name, employee_status, jp_target
        FROM employees
        WHERE nip NOT LIKE 'TEMP-%'
        ORDER BY name ASC
      `,
    )
    return rows
  }

  const [rows] = await db.query(
    `
      SELECT id, nip, name, employee_status, jp_target
      FROM employees
      WHERE id = ?
      LIMIT 1
    `,
    [user.employeeId],
  )

  return rows
}
