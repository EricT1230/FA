const Redis = require('ioredis')
const { Pool } = require('pg')
const express = require('express')

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
    
    // Check if health endpoint is responding
    const response = await fetch('http://localhost:3001/health')
    if (!response.ok) {
      throw new Error('Health endpoint not responding')
    }
    
    console.log('Scheduler health check passed')
    process.exit(0)
  } catch (error) {
    console.error('Scheduler health check failed:', error.message)
    process.exit(1)
  }
}

healthCheck()