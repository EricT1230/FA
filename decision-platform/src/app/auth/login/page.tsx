'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { authClient } from '@/lib/auth/auth-client'
import { Shield, Github, Mail, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authClient.login(formData.email, formData.password)
      
      if (result.success) {
        router.push('/')
      } else {
        setError(result.error || '登入失敗，請檢查您的帳號密碼')
      }
    } catch (error) {
      setError('登入過程發生錯誤，請稍後再試')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = authClient.getGoogleLoginUrl()
  }

  const handleGitHubLogin = () => {
    window.location.href = authClient.getGitHubLoginUrl()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl">登入您的帳戶</CardTitle>
          <div className="text-sm text-slate-600">
            存取接案彙總評分平台
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* OAuth 登入選項 */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <Mail className="mr-2 h-4 w-4" />
              使用 Google 登入
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl"
              onClick={handleGitHubLogin}
              disabled={loading}
            >
              <Github className="mr-2 h-4 w-4" />
              使用 GitHub 登入
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">或使用帳號密碼</span>
            </div>
          </div>

          {/* 帳號密碼登入 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="rounded-2xl"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="輸入您的密碼"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="rounded-2xl pr-10"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-2xl"
              disabled={loading}
            >
              {loading ? '登入中...' : '登入'}
            </Button>
          </form>

          <div className="text-center">
            <div className="text-sm text-slate-600">
              還沒有帳戶？{' '}
              <a href="/auth/register" className="text-blue-600 hover:underline">
                立即註冊
              </a>
            </div>
          </div>

          {/* Demo 說明 */}
          <div className="text-xs text-slate-500 bg-slate-100 rounded-xl p-3">
            <div className="font-semibold mb-1">🚧 MVP Demo</div>
            <div>
              這是登入功能的展示版本。實際部署時會連接到 SSO 微服務 (Port 4000)。
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}