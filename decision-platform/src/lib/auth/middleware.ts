import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
    role: string
    type?: 'user' | 'service'
    permissions?: string[]
  }
}

export function createAuthMiddleware(options: {
  requireAuth?: boolean
  allowedRoles?: string[]
  requirePermissions?: string[]
} = {}) {
  return async (request: NextRequest) => {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (options.requireAuth) {
        return NextResponse.json(
          { success: false, error: 'Authorization header required' },
          { status: 401 }
        )
      }
      return null // Allow request to proceed without auth
    }

    const token = authHeader.substring(7)

    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'fa-auth-service',
        audience: ['fa-app', 'fa-services']
      }) as any

      // Create user object from JWT payload
      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role || 'user',
        type: payload.type || 'user',
        permissions: payload.permissions || []
      }

      // Check role requirements
      if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient role permissions' },
          { status: 403 }
        )
      }

      // Check permission requirements
      if (options.requirePermissions) {
        const hasAllPermissions = options.requirePermissions.every(
          permission => user.permissions.includes(permission)
        )
        
        if (!hasAllPermissions) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      // Add user to request (for route handlers)
      // Note: This is a simplified approach. In practice, you might use a different method
      // to pass user data to route handlers
      
      return null // Allow request to proceed
    } catch (error) {
      console.error('Auth middleware error:', error)
      
      if (options.requireAuth) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
      
      return null // Allow request to proceed without auth
    }
  }
}

// Predefined middleware configurations
export const requireAuth = createAuthMiddleware({ requireAuth: true })

export const requireTeamOwner = createAuthMiddleware({ 
  requireAuth: true, 
  allowedRoles: ['OWNER', 'ADMIN'] 
})

export const requireDecisionMaker = createAuthMiddleware({ 
  requireAuth: true, 
  allowedRoles: ['OWNER', 'DECISION_OWNER', 'ADMIN'] 
})

export const requireAdmin = createAuthMiddleware({ 
  requireAuth: true, 
  allowedRoles: ['ADMIN'] 
})

// Server-side auth verification for Server Actions
export async function verifyServerAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization header')
  }

  const token = authHeader.substring(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'fa-auth-service',
      audience: ['fa-app', 'fa-services']
    }) as any

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'user',
      type: payload.type || 'user',
      permissions: payload.permissions || []
    }
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

// Extract user from request headers (for Server Actions)
export async function getCurrentUser(request?: Request) {
  if (!request) return null
  
  const authHeader = request.headers.get('authorization')
  
  try {
    return await verifyServerAuth(authHeader)
  } catch {
    return null
  }
}

// Check if user has permission
export function hasPermission(user: any, permission: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  return user.permissions?.includes(permission) || false
}

// Check if user can access team
export function canAccessTeam(user: any, teamId: string, requiredRole?: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  
  // In a real app, you'd check team membership from database
  // For now, this is a placeholder
  return true
}