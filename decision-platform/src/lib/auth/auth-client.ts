interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  avatarUrl?: string
}

interface SessionData {
  accessToken: string
  refreshToken: string
  sessionToken: string
  expiresAt: string
  user: AuthUser
}

class AuthClient {
  private baseUrl: string
  private accessToken: string | null = null
  private refreshToken: string | null = null
  
  constructor() {
    this.baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4000/api'
    
    // Load tokens from localStorage on client side
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('fa_access_token')
      this.refreshToken = localStorage.getItem('fa_refresh_token')
    }
  }

  // Register new user
  async register(data: { name: string; email: string; password: string }) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (result.success) {
      this.setTokens(result.data)
    }

    return result
  }

  // Login with email/password
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const result = await response.json()

    if (result.success) {
      this.setTokens(result.data)
    }

    return result
  }

  // OAuth login URLs
  getGoogleLoginUrl() {
    return `${this.baseUrl}/auth/google`
  }

  getGitHubLoginUrl() {
    return `${this.baseUrl}/auth/github`
  }

  // Handle OAuth callback
  setTokensFromCallback(token: string, refresh: string) {
    this.accessToken = token
    this.refreshToken = refresh
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('fa_access_token', token)
      localStorage.setItem('fa_refresh_token', refresh)
    }
  }

  // Logout
  async logout() {
    try {
      const sessionToken = typeof window !== 'undefined' 
        ? localStorage.getItem('fa_session_token') 
        : null

      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` })
        },
        body: JSON.stringify({ sessionToken }),
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearTokens()
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.accessToken) {
      return null
    }

    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/auth/verify`)
      const result = await response.json()

      if (result.success) {
        return result.data.user
      }

      return null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Get user profile
  async getUserProfile() {
    const response = await this.fetchWithAuth(`${this.baseUrl}/user/profile`)
    return response.json()
  }

  // Update user profile
  async updateProfile(data: { name?: string; notificationPreferences?: any }) {
    const response = await this.fetchWithAuth(`${this.baseUrl}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return response.json()
  }

  // Get user teams
  async getUserTeams() {
    const response = await this.fetchWithAuth(`${this.baseUrl}/user/teams`)
    return response.json()
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  // Get access token
  getAccessToken(): string | null {
    return this.accessToken
  }

  // Private methods
  private setTokens(sessionData: SessionData) {
    this.accessToken = sessionData.accessToken
    this.refreshToken = sessionData.refreshToken
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('fa_access_token', sessionData.accessToken)
      localStorage.setItem('fa_refresh_token', sessionData.refreshToken)
      localStorage.setItem('fa_session_token', sessionData.sessionToken)
      localStorage.setItem('fa_user', JSON.stringify(sessionData.user))
    }
  }

  private clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fa_access_token')
      localStorage.removeItem('fa_refresh_token')
      localStorage.removeItem('fa_session_token')
      localStorage.removeItem('fa_user')
    }
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const headers = {
      ...options.headers,
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` })
    }

    let response = await fetch(url, { ...options, headers })

    // If token expired, try to refresh
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken()
      if (refreshed) {
        // Retry with new token
        headers.Authorization = `Bearer ${this.accessToken}`
        response = await fetch(url, { ...options, headers })
      }
    }

    return response
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })

      const result = await response.json()

      if (result.success) {
        this.accessToken = result.data.accessToken
        if (typeof window !== 'undefined') {
          localStorage.setItem('fa_access_token', result.data.accessToken)
        }
        return true
      }

      // Refresh failed, clear tokens
      this.clearTokens()
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearTokens()
      return false
    }
  }
}

export const authClient = new AuthClient()
export type { AuthUser, SessionData }