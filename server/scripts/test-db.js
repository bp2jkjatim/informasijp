import { pingDatabase } from '../db.js'

try {
  const result = await pingDatabase()
  console.log('Database OK:', result)
  process.exit(0)
} catch (error) {
  console.error('Database connection failed')
  console.error(error)
  process.exit(1)
}
