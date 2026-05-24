import bcrypt from 'bcryptjs'
import { config } from '../config.js'
import { getDbPool } from '../db.js'

async function ensureEmployeeForBasicUser(db, username) {
  const [existingRows] = await db.query(
    'SELECT id FROM employees WHERE nip = ? LIMIT 1',
    [username],
  )

  if (existingRows.length > 0) {
    return existingRows[0].id
  }

  const [result] = await db.query(
    `
      INSERT INTO employees (
        nip,
        name,
        employee_status,
        jp_target
      ) VALUES (?, ?, ?, ?)
    `,
    [username, 'Basic User Seed', 'PNS', 20],
  )

  return result.insertId
}

async function ensureUser(db, { username, password, role, employeeId = null }) {
  const [rows] = await db.query(
    'SELECT id, role, employee_id FROM users WHERE username = ? LIMIT 1',
    [username],
  )

  if (rows.length > 0) {
    if (rows[0].role !== role || rows[0].employee_id !== employeeId) {
      await db.query(
        'UPDATE users SET role = ?, employee_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [role, employeeId, rows[0].id],
      )
    }
    return rows[0].id
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const [result] = await db.query(
    `
      INSERT INTO users (
        username,
        password_hash,
        role,
        employee_id,
        is_active
      ) VALUES (?, ?, ?, ?, 1)
    `,
    [username, passwordHash, role, employeeId],
  )

  return result.insertId
}

export async function seedDefaultUsers() {
  const db = getDbPool()
  const basicEmployeeId = await ensureEmployeeForBasicUser(db, config.defaults.basic.username)

  const accounts = [
    config.defaults.admin,
    config.defaults.leader,
    config.defaults.kepalaBalai,
    config.defaults.ktu,
    { ...config.defaults.basic, employeeId: basicEmployeeId },
  ]

  for (const account of accounts) {
    await ensureUser(db, account)
  }

  return {
    seededUsers: accounts.map(({ username, role }) => ({ username, role })),
  }
}
