import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAgo(iso: string, useRelative: boolean = true) {
  const date = new Date(iso)
  
  // 如果不使用相對時間或在伺服器端，返回固定日期格式
  if (!useRelative || typeof window === 'undefined') {
    return date.toLocaleDateString('zh-Hant-TW', {
      month: '2-digit',
      day: '2-digit'
    })
  }
  
  const t = date.getTime()
  const now = Date.now()
  const diff = Math.max(0, now - t)
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.floor(min / 60)
  if (hr < 48) return `${hr} 小時前`
  const d = Math.floor(hr / 24)
  return `${d} 天前`
}

export function formatTwd(n?: number) {
  if (n == null) return "—"
  return new Intl.NumberFormat("zh-Hant-TW", { maximumFractionDigits: 0 }).format(n)
}

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}