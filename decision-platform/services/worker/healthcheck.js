const Redis = require('ioredis')
const { Pool } = require('pg')

async function healthCheck() {
  try {
    // Check Redis connection
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    await redis.ping()
    await redis.quit()
    
    // Check database connection
    const db = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    })
    await db.query('SELECT 1')
    await db.end()
    
    console.log('Health check passed')
    process.exit(0)
  } catch (error) {
    console.error('Health check failed:', error.message)
    process.exit(1)
  }
}

healthCheck()