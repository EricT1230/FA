'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient, type AuthUser } from '@/lib/auth/auth-client'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      try {
        const currentUser = await authClient.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Auth check error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const result = await authClient.login(email, password)
    if (result.success) {
      setUser(result.data.user)
    }
    return result
  }

  const logout = async () => {
    await authClient.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { redirectTo?: string; allowedRoles?: string[] } = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()
    const { redirectTo = '/auth/login', allowedRoles } = options

    useEffect(() => {
      if (!loading && !user) {
        window.location.href = redirectTo
        return
      }

      if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        window.location.href = '/unauthorized'
        return
      }
    }, [user, loading])

    if (loading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <div className="text-slate-600">檢查登入狀態中...</div>
          </div>
        </div>
      )
    }

    if (!user) {
      return null // Will redirect via useEffect
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return null // Will redirect via useEffect
    }

    return <Component {...props} />
  }
}