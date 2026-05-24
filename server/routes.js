import session from 'express-session'
import { authenticateUser } from './auth.js'
import { config } from './config.js'
import { attachSessionUser, requireAuth, requirePrivilegedRole } from './middleware.js'
import { getDashboardSummaryForUser, listEmployeesForUser } from './services/dashboard.js'
import { createTrainingForUser, listTrainingsForUser, uploadCertificate } from './services/trainings.js'

export function registerRoutes(app) {
  app.use(
    session({
      secret: config.app.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  )
  app.use(attachSessionUser)

  app.post('/api/auth/login', async (request, response) => {
    try {
      const user = await authenticateUser(request.body.username, request.body.password)
      if (!user) {
        response.status(401).json({
          ok: false,
          message: 'Username atau password salah',
        })
        return
      }

      request.session.username = user.username
      response.json({
        ok: true,
        user,
      })
    } catch (error) {
      response.status(500).json({
        ok: false,
        message: 'Login failed',
        error: error.message,
      })
    }
  })

  app.get('/api/auth/me', requireAuth, async (request, response) => {
    response.json({
      ok: true,
      user: request.currentUser,
    })
  })

  app.post('/api/auth/logout', requireAuth, async (request, response) => {
    request.session.destroy(() => {
      response.clearCookie('connect.sid')
      response.json({ ok: true })
    })
  })

  app.get('/api/dashboard', requireAuth, async (request, response) => {
    try {
      const payload = await getDashboardSummaryForUser(request.currentUser)
      response.json({
        ok: true,
        ...payload,
      })
    } catch (error) {
      response.status(500).json({
        ok: false,
        message: 'Failed to load dashboard',
        error: error.message,
      })
    }
  })

  app.get('/api/employees', requireAuth, async (request, response) => {
    try {
      const employees = await listEmployeesForUser(request.currentUser)
      response.json({
        ok: true,
        employees,
      })
    } catch (error) {
      response.status(500).json({
        ok: false,
        message: 'Failed to load employees',
        error: error.message,
      })
    }
  })

  app.get('/api/trainings', requireAuth, async (request, response) => {
    try {
      const rows = await listTrainingsForUser(request.currentUser, request.query.employeeId)
      response.json({
        ok: true,
        trainings: rows,
      })
    } catch (error) {
      response.status(500).json({
        ok: false,
        message: 'Failed to load trainings',
        error: error.message,
      })
    }
  })

  app.post(
    '/api/trainings',
    requireAuth,
    uploadCertificate.single('certificateFile'),
    async (request, response) => {
      try {
        const trainingId = await createTrainingForUser(
          request.currentUser,
          request.body,
          request.file,
        )
        response.status(201).json({
          ok: true,
          trainingId,
        })
      } catch (error) {
        response.status(400).json({
          ok: false,
          message: error.message,
        })
      }
    },
  )

  app.get('/api/admin/users', requireAuth, requirePrivilegedRole, async (_request, response) => {
    response.json({
      ok: true,
    })
  })
}
