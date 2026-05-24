import path from 'node:path'
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { XMLParser } from 'fast-xml-parser'
import { getDbPool } from '../db.js'

const ROOT_DIR = path.resolve(process.cwd())
const DEFAULT_WORKBOOK = path.join(ROOT_DIR, 'Data SDM BP2JK Jatim-2.xlsx')

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: false,
})

function asArray(value) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function readXmlFromZip(zip, entryName) {
  const entry = zip.getEntry(entryName)
  if (!entry) {
    throw new Error(`Workbook entry not found: ${entryName}`)
  }

  return parser.parse(entry.getData().toString())
}

function columnLetters(cellReference) {
  return (cellReference.match(/[A-Z]+/) || [''])[0]
}

function collectText(node) {
  if (!node) {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join('')
  }

  if (typeof node === 'object') {
    if (typeof node['#text'] === 'string') {
      return node['#text']
    }

    return Object.values(node).map(collectText).join('')
  }

  return ''
}

function parseSharedStrings(zip) {
  if (!zip.getEntry('xl/sharedStrings.xml')) {
    return []
  }

  const xml = readXmlFromZip(zip, 'xl/sharedStrings.xml')
  return asArray(xml.sst?.si).map((item) => collectText(item))
}

function getSheetPathByName(zip, targetName) {
  const workbookXml = readXmlFromZip(zip, 'xl/workbook.xml')
  const workbookRelsXml = readXmlFromZip(zip, 'xl/_rels/workbook.xml.rels')
  const relationships = new Map(
    asArray(workbookRelsXml.Relationships?.Relationship).map((rel) => [rel.Id, rel.Target]),
  )

  for (const sheet of asArray(workbookXml.workbook?.sheets?.sheet)) {
    if (sheet.name === targetName) {
      const target = relationships.get(sheet['r:id'])
      if (!target) {
        throw new Error(`Workbook relationship not found for sheet ${targetName}`)
      }
      return `xl/${target}`
    }
  }

  throw new Error(`Sheet "${targetName}" not found in workbook`)
}

function getCellValue(cell, sharedStrings) {
  const rawValue = cell?.v
  if (rawValue === undefined || rawValue === null) {
    return ''
  }

  if (cell.t === 's') {
    return sharedStrings[Number(rawValue)] ?? ''
  }

  return String(rawValue)
}

function readSheetRows(zip, sheetName, sharedStrings) {
  const sheetPath = getSheetPathByName(zip, sheetName)
  const xml = readXmlFromZip(zip, sheetPath)

  return asArray(xml.worksheet?.sheetData?.row).map((row) => {
    const rowData = {}
    for (const cell of asArray(row.c)) {
      rowData[columnLetters(cell.r)] = getCellValue(cell, sharedStrings)
    }
    return rowData
  })
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeName(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[\.,']/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function normalizeBaseName(value) {
  const raw = normalizeWhitespace(value)
  const base = raw.includes(',') ? raw.split(',')[0] : raw
  return normalizeName(base)
}

function normalizeNip(value) {
  const text = String(value || '').trim()
  if (!text) {
    return ''
  }

  if (/^\d+(\.0+)?$/.test(text)) {
    return text.replace(/\.0+$/, '')
  }

  const scientificMatch = text.match(/^(\d+(?:\.\d+)?)e\+(\d+)$/i)
  if (!scientificMatch) {
    return text
  }

  const [whole = '', fraction = ''] = scientificMatch[1].split('.')
  const exponent = Number(scientificMatch[2])
  const digits = `${whole}${fraction}`
  const targetLength = exponent + 1
  return digits + '0'.repeat(Math.max(0, targetLength - digits.length))
}

function excelSerialToIsoDate(serialText) {
  if (!/^\d+(\.\d+)?$/.test(serialText)) {
    return null
  }

  const serial = Number(serialText)
  if (!Number.isFinite(serial) || serial < 1) {
    return null
  }

  const base = Date.UTC(1899, 11, 30)
  return new Date(base + serial * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function normalizeTrainingDate(rawValue) {
  const cleaned = normalizeWhitespace(String(rawValue || '').replace(/\n/g, ' '))
  if (!cleaned) {
    return ''
  }

  return excelSerialToIsoDate(cleaned) || cleaned
}

function parseCheckbox(value) {
  const cleaned = normalizeWhitespace(value).toLowerCase()
  return cleaned === '√' || cleaned === 'v' || cleaned === 'ya' || cleaned === 'y' || cleaned === '1'
}

function parseNumber(value) {
  const cleaned = String(value || '').trim().replace(',', '.')
  if (!cleaned) {
    return 0
  }

  const numeric = Number(cleaned)
  return Number.isFinite(numeric) ? numeric : 0
}

function parseEmployees(rows) {
  const employees = []

  for (const row of rows.slice(1)) {
    const name = normalizeWhitespace(row.B)
    const nip = normalizeNip(row.C)

    if (!name || !nip) {
      continue
    }

    employees.push({
      name,
      nip,
    })
  }

  return employees
}

function findEmployeeByTrainingName(employeeLookup, employeeName) {
  return (
    employeeLookup.get(normalizeName(employeeName)) ||
    employeeLookup.get(normalizeBaseName(employeeName)) ||
    null
  )
}

function parseTrainings(rows, employeeLookup) {
  const trainings = []
  const unmatchedNames = new Set()
  let currentEmployeeName = ''
  let currentProposedTraining = ''

  for (const row of rows.slice(4)) {
    if (normalizeWhitespace(row.B)) {
      currentEmployeeName = normalizeWhitespace(row.B)
    }

    if (normalizeWhitespace(row.C)) {
      currentProposedTraining = normalizeWhitespace(row.C)
    }

    const trainingName = normalizeWhitespace(row.D)
    if (!currentEmployeeName || !trainingName) {
      continue
    }

    const employee = findEmployeeByTrainingName(employeeLookup, currentEmployeeName)
    if (!employee) {
      unmatchedNames.add(currentEmployeeName)
    }

    trainings.push({
      employeeId: employee?.id ?? null,
      employeeName: employee?.name ?? currentEmployeeName,
      sourceEmployeeName: currentEmployeeName,
      proposedTraining: currentProposedTraining,
      trainingName,
      trainingDateText: normalizeTrainingDate(row.E),
      trainingProvider: normalizeWhitespace(row.F),
      certificateNumber: normalizeWhitespace(row.G),
      certificateLink: normalizeWhitespace(row.N),
      isPbj: parseCheckbox(row.H),
      isJabatan: parseCheckbox(row.I),
      isIntegritas: parseCheckbox(row.J),
      jumlahJp: parseNumber(row.K),
      year: 2025,
    })
  }

  return {
    trainings,
    unmatchedNames: [...unmatchedNames].sort(),
  }
}

async function upsertEmployees(connection, employees) {
  const employeeLookup = new Map()
  let inserted = 0
  let updated = 0

  function rememberEmployee(record, names) {
    for (const name of names.filter(Boolean)) {
      employeeLookup.set(normalizeName(name), record)
      employeeLookup.set(normalizeBaseName(name), record)
    }
  }

  for (const employee of employees) {
    const [existingRows] = await connection.query(
      'SELECT id, name FROM employees WHERE nip = ? LIMIT 1',
      [employee.nip],
    )

    if (existingRows.length === 0) {
      const [result] = await connection.query(
        `
          INSERT INTO employees (
            nip,
            name,
            employee_status,
            jp_target
          ) VALUES (?, ?, 'PNS', 20)
        `,
        [employee.nip, employee.name],
      )

      rememberEmployee(
        {
          id: result.insertId,
          name: employee.name,
          nip: employee.nip,
        },
        [employee.name],
      )
      inserted += 1
      continue
    }

    const existing = existingRows[0]
    if (existing.name !== employee.name) {
      await connection.query(
        'UPDATE employees SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [employee.name, existing.id],
      )
      updated += 1
    }

    rememberEmployee(
      {
        id: existing.id,
        name: employee.name,
        nip: employee.nip,
      },
      [employee.name, existing.name],
    )
  }

  return {
    employeeLookup,
    inserted,
    updated,
  }
}

async function deleteTemporaryEmployees(connection) {
  await connection.query('DELETE FROM trainings WHERE employee_id IN (SELECT id FROM employees WHERE nip LIKE ?)', [
    'TEMP-%',
  ])
  await connection.query('DELETE FROM employees WHERE nip LIKE ?', ['TEMP-%'])
}

async function replaceTrainingsForYear(connection, year, trainings) {
  await connection.query('DELETE FROM trainings WHERE year = ?', [year])

  let inserted = 0
  for (const training of trainings) {
    await connection.query(
      `
        INSERT INTO trainings (
          employee_id,
          proposed_training,
          training_name,
          training_date_text,
          training_provider,
          certificate_number,
          certificate_link,
          is_pbj,
          is_jabatan,
          is_integritas,
          jumlah_jp,
          year
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        training.employeeId,
        training.proposedTraining || null,
        training.trainingName,
        training.trainingDateText || null,
        training.trainingProvider || null,
        training.certificateNumber || null,
        training.certificateLink || null,
        training.isPbj ? 1 : 0,
        training.isJabatan ? 1 : 0,
        training.isIntegritas ? 1 : 0,
        training.jumlahJp,
        training.year,
      ],
    )
    inserted += 1
  }

  return inserted
}

export async function importWorkbookToDatabase(filePath = DEFAULT_WORKBOOK) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Workbook not found: ${filePath}`)
  }

  const AdmZipModule = await import('adm-zip')
  const AdmZip = AdmZipModule.default
  const zip = new AdmZip(readFileSync(filePath))
  const sharedStrings = parseSharedStrings(zip)
  const employeeRows = readSheetRows(zip, 'DataPegawai', sharedStrings)
  const trainingRows = readSheetRows(zip, 'Diklat 2025 dan evaluasi', sharedStrings)

  const employees = parseEmployees(employeeRows)
  const db = getDbPool()
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const { employeeLookup, inserted, updated } = await upsertEmployees(connection, employees)
    await deleteTemporaryEmployees(connection)
    const parsedTrainings = parseTrainings(trainingRows, employeeLookup)
    const trainings = parsedTrainings.trainings.filter((training) => training.employeeId)

    const importedTrainingCount = await replaceTrainingsForYear(connection, 2025, trainings)
    await connection.commit()

    return {
      workbook: path.basename(filePath),
      employees: {
        parsed: employees.length,
        inserted,
        updated,
      },
      trainings: {
        imported: importedTrainingCount,
        skippedMissingEmployees: parsedTrainings.unmatchedNames,
      },
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
