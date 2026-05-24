import mysql from 'mysql2/promise'
import { config } from './config.js'

let pool

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: true,
    })
  }

  return pool
}

export async function pingDatabase() {
  const db = getDbPool()
  const [rows] = await db.query('SELECT 1 AS ok')
  return rows[0]
}
