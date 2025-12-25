const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const session = require('express-session')
const RedisStore = require('connect-redis').default
const Redis = require('ioredis')
const passport = require('passport')
const winston = require('winston')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const { initializePassport } = require('./config/passport')
const { initializeDatabase } = require('./config/database')

const app = express()
const PORT = process.env.PORT || 4000

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'auth-service.log' })
  ]
})

// Redis connection for sessions
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
})

redis.on('error', (err) => {
  logger.error('Redis connection error:', err)
})

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
})
app.use('/api/', limiter)

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 auth requests per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
})

// Session configuration
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Initialize Passport strategies
initializePassport(passport)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  })
})

// API Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/user', userRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Auth service error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  })

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.details
    })
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    })
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase()
    logger.info('Database initialized successfully')

    app.listen(PORT, () => {
      logger.info(`Auth service started on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      })
    })
  } catch (error) {
    logger.error('Failed to start auth service:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down auth service...')
  await redis.quit()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Shutting down auth service...')
  await redis.quit()
  process.exit(0)
})

startServer()