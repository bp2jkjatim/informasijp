import { seedDefaultUsers } from '../services/bootstrap.js'

try {
  const result = await seedDefaultUsers()
  console.log('Seeded default users:')
  console.table(result.seededUsers)
  process.exit(0)
} catch (error) {
  console.error('Failed to seed default users')
  console.error(error)
  process.exit(1)
}
