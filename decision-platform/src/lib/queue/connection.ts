import Redis from 'ioredis'
import { Queue } from 'bullmq'

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
})

// Job Queues
export const ingestionQueue = new Queue('ingestion', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  }
})

export const scoringQueue = new Queue('scoring', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  }
})

export const riskGateQueue = new Queue('risk-gate', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  }
})

export const notificationQueue = new Queue('notification', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
  }
})