import bcrypt from 'bcryptjs'
import { getDbPool } from './db.js'

export const PRIVILEGED_ROLES = ['admin', 'leader', 'kepala_balai', 'ktu']

export function isPrivilegedRole(role) {
  return PRIVILEGED_ROLES.includes(role)
}

export async function findUserByUsername(username) {
  const db = getDbPool()
  const [rows] = await db.query(
    `
      SELECT
        u.id,
        u.username,
        u.password_hash,
        u.role,
        u.employee_id,
        u.is_active,
        e.name AS employee_name,
        e.nip AS employee_nip
      FROM users u
      LEFT JOIN employees e ON e.id = u.employee_id
      WHERE u.username = ?
      LIMIT 1
    `,
    [username],
  )

  return rows[0] || null
}

export async function authenticateUser(username, password) {
  const user = await findUserByUsername(username)
  if (!user || !user.is_active) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) {
    return null
  }

  return sanitizeUser(user)
}

export function sanitizeUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    employeeId: user.employee_id,
    employeeName: user.employee_name,
    employeeNip: user.employee_nip,
  }
}
