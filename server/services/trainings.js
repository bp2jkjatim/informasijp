import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { getDbPool } from '../db.js'
import { isPrivilegedRole } from '../auth.js'

const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'certificates')
fs.mkdirSync(uploadsRoot, { recursive: true })

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadsRoot)
  },
  filename: (_request, file, callback) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    callback(null, `${Date.now()}-${safeOriginal}`)
  },
})

export const uploadCertificate = multer({ storage })

function parseBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 1 || value === 'on'
}

function parseNumeric(value) {
  const numeric = Number(String(value || '').replace(',', '.'))
  return Number.isFinite(numeric) ? numeric : 0
}

export async function listTrainingsForUser(user, employeeId) {
  const db = getDbPool()
  const effectiveEmployeeId = isPrivilegedRole(user.role) && employeeId ? Number(employeeId) : user.employeeId

  const [rows] = await db.query(
    `
      SELECT
        t.id,
        t.training_name,
        t.proposed_training,
        t.training_date_text,
        t.training_provider,
        t.certificate_number,
        t.certificate_file_path,
        t.certificate_link,
        t.is_pbj,
        t.is_jabatan,
        t.is_integritas,
        t.jumlah_jp,
        t.year,
        e.id AS employee_id,
        e.name AS employee_name,
        e.nip AS employee_nip
      FROM trainings t
      INNER JOIN employees e ON e.id = t.employee_id
      WHERE t.employee_id = ?
      ORDER BY t.created_at DESC, t.id DESC
    `,
    [effectiveEmployeeId],
  )

  return rows
}

export async function createTrainingForUser(user, payload, file) {
  const db = getDbPool()
  const employeeId = isPrivilegedRole(user.role)
    ? Number(payload.employeeId || user.employeeId)
    : user.employeeId

  if (!employeeId) {
    throw new Error('Employee target is required')
  }

  const [employees] = await db.query(
    'SELECT id, nip FROM employees WHERE id = ? AND nip NOT LIKE ? LIMIT 1',
    [employeeId, 'TEMP-%'],
  )
  if (employees.length === 0) {
    throw new Error('Employee not found')
  }

  if (!payload.trainingName || !String(payload.trainingName).trim()) {
    throw new Error('Nama diklat wajib diisi')
  }

  const certificatePath = file ? `/uploads/certificates/${file.filename}` : null
  const [result] = await db.query(
    `
      INSERT INTO trainings (
        employee_id,
        proposed_training,
        training_name,
        training_date_text,
        training_provider,
        certificate_number,
        certificate_file_path,
        certificate_link,
        is_pbj,
        is_jabatan,
        is_integritas,
        jumlah_jp,
        year,
        created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      employeeId,
      payload.proposedTraining || null,
      String(payload.trainingName).trim(),
      payload.trainingDateText || null,
      payload.trainingProvider || null,
      payload.certificateNumber || null,
      certificatePath,
      payload.certificateLink || null,
      parseBoolean(payload.isPbj) ? 1 : 0,
      parseBoolean(payload.isJabatan) ? 1 : 0,
      parseBoolean(payload.isIntegritas) ? 1 : 0,
      parseNumeric(payload.jumlahJp),
      Number(payload.year || 2025),
      user.id,
    ],
  )

  return result.insertId
}
