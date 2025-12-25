import { describe, it, expect } from '@jest/globals'

// Basic utility function for testing
function add(a: number, b: number): number {
  return a + b
}

function isEven(num: number): boolean {
  return num % 2 === 0
}

describe('Utility Functions', () => {
  describe('add function', () => {
    it('should add two positive numbers correctly', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0)
    })

    it('should handle zero', () => {
      expect(add(0, 5)).toBe(5)
    })
  })

  describe('isEven function', () => {
    it('should return true for even numbers', () => {
      expect(isEven(2)).toBe(true)
      expect(isEven(0)).toBe(true)
      expect(isEven(-2)).toBe(true)
    })

    it('should return false for odd numbers', () => {
      expect(isEven(1)).toBe(false)
      expect(isEven(3)).toBe(false)
      expect(isEven(-1)).toBe(false)
    })
  })
})

// Test environment setup
describe('Test Environment', () => {
  it('should have NODE_ENV set to test', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  it('should have database URL configured', () => {
    expect(process.env.DATABASE_URL).toContain('test_freelancer_aggregator')
  })

  it('should have Redis URL configured', () => {
    expect(process.env.REDIS_URL).toContain('localhost:6379')
  })
})