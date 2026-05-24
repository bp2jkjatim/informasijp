import path from 'node:path'
import { importWorkbookToDatabase } from '../services/importExcel.js'

const workbookPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : undefined

try {
  const result = await importWorkbookToDatabase(workbookPath)
  console.log('Excel import completed')
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
} catch (error) {
  console.error('Excel import failed')
  console.error(error)
  process.exit(1)
}
