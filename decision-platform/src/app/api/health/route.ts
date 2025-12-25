import { NextResponse } from 'next/server'
import { db } from '@/lib/db/connection'
import { redis } from '@/lib/queue/connection'

export async function GET() {
  try {
    // Check database connection
    await db.query('SELECT 1')
    
    // Check Redis connection
    await redis.ping()
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}