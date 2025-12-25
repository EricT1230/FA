'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth/auth-client'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const refresh = searchParams.get('refresh')

    if (token && refresh) {
      // Store tokens from OAuth callback
      authClient.setTokensFromCallback(token, refresh)
      
      // Redirect to main app
      router.replace('/')
    } else {
      // No tokens, redirect to login
      router.replace('/auth/login')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Card className="w-full max-w-md rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Sparkles className="h-6 w-6 animate-spin" />
            </div>
          </div>
          <div className="text-lg font-semibold text-slate-900 mb-2">
            正在登入...
          </div>
          <div className="text-sm text-slate-600">
            請稍候，正在處理您的登入資訊
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Sparkles className="h-6 w-6 animate-spin" />
              </div>
            </div>
            <div className="text-lg font-semibold text-slate-900 mb-2">
              載入中...
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}