import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { pingDatabase } from './db.js'
import { registerRoutes } from './routes.js'
import { seedDefaultUsers } from './services/bootstrap.js'

const app = express()

app.use(
  cors({
    origin: config.app.origin,
    credentials: true,
  }),
)
app.use(express.json())
app.use('/uploads', express.static('uploads'))
registerRoutes(app)

app.get('/api/health', async (_request, response) => {
  try {
    const database = await pingDatabase()
    response.json({
      ok: true,
      app: 'informasijp-api',
      database,
    })
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: 'Database health check failed',
      error: error.message,
    })
  }
})

async function start() {
  try {
    await pingDatabase()
    await seedDefaultUsers()

    app.listen(config.app.port, () => {
      console.log(`API server listening on http://localhost:${config.app.port}`)
    })
  } catch (error) {
    console.error('Failed to start API server')
    console.error(error)
    process.exit(1)
  }
}

start()
