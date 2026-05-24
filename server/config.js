import dotenv from 'dotenv'

dotenv.config()

export const config = {
  app: {
    port: Number(process.env.PORT || 3100),
    origin: process.env.APP_ORIGIN || 'http://localhost:5173',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'informasijp',
    user: process.env.DB_USER || 'informasijp',
    password: process.env.DB_PASSWORD || 'informasijp',
  },
  defaults: {
    admin: {
      username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin',
      role: 'admin',
    },
    leader: {
      username: process.env.DEFAULT_LEADER_USERNAME || 'leader',
      password: process.env.DEFAULT_LEADER_PASSWORD || 'leader',
      role: 'leader',
    },
    kepalaBalai: {
      username: process.env.DEFAULT_KEPALA_BALAI_USERNAME || 'kepala_balai',
      password: process.env.DEFAULT_KEPALA_BALAI_PASSWORD || 'kepala_balai',
      role: 'kepala_balai',
    },
    ktu: {
      username: process.env.DEFAULT_KTU_USERNAME || 'ktu',
      password: process.env.DEFAULT_KTU_PASSWORD || 'ktu',
      role: 'ktu',
    },
    basic: {
      username: process.env.DEFAULT_BASIC_USERNAME || 'nip',
      password: process.env.DEFAULT_BASIC_PASSWORD || 'nip',
      role: 'user',
    },
  },
}
