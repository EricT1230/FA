'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, XCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { RiskGateResult, RiskFactor } from '@/types'
import { cn } from '@/lib/utils'

interface RiskGateDisplayProps {
  result: RiskGateResult
  className?: string
}

export function RiskGateDisplay({ result, className }: RiskGateDisplayProps) {
  const statusConfig = {
    'PASS': {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      label: '✅ 可以投遞'
    },
    'SOFT_WARNING': {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      label: '🟡 謹慎評估'
    },
    'HARD_BLOCK': {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200', 
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      label: '🔴 不建議投遞'
    }
  }

  const config = statusConfig[result.gateStatus]
  const StatusIcon = config.icon

  return (
    <Card className={cn(
      'rounded-2xl border-2',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className={cn(
          'flex items-center gap-2 text-base font-semibold',
          config.textColor
        )}>
          <StatusIcon className={cn('h-5 w-5', config.iconColor)} />
          Risk Gate 評估 - {config.label}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 主要說明 */}
        <div className={cn('space-y-2', config.textColor)}>
          {result.explanation.map((line, index) => (
            <div key={index} className={index === 0 ? 'font-semibold' : ''}>
              {line}
            </div>
          ))}
        </div>

        {/* 風險因素詳細列表 */}
        {result.riskFactors.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-900">
              風險因素詳情：
            </div>
            <div className="space-y-2">
              {result.riskFactors.map((factor, index) => (
                <RiskFactorItem key={index} factor={factor} />
              ))}
            </div>
          </div>
        )}

        {/* 風險分數 */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-sm text-slate-600">風險分數</span>
          <div className="flex items-center gap-2">
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold',
              config.bgColor,
              config.textColor,
              'border',
              config.borderColor
            )}>
              {Math.round(result.score * 100)}%
            </div>
            <Badge variant="outline" className="text-xs">
              {result.recommendation.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RiskFactorItemProps {
  factor: RiskFactor
}

function RiskFactorItem({ factor }: RiskFactorItemProps) {
  const severityConfig = {
    'LOW': { color: 'text-blue-700', bg: 'bg-blue-100', icon: '💡' },
    'MEDIUM': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⚠️' },
    'HIGH': { color: 'text-orange-700', bg: 'bg-orange-100', icon: '🔥' },
    'CRITICAL': { color: 'text-red-700', bg: 'bg-red-100', icon: '🚨' }
  }

  const config = severityConfig[factor.severity]

  const typeLabels = {
    'COMPETITION': '競爭度',
    'BUDGET': '預算',
    'SCOPE': '需求範圍',
    'TIMELINE': '時程',
    'FRAUD_SIGNAL': '詐騙信號'
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
      <div className="text-lg">{config.icon}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {typeLabels[factor.type]}
          </Badge>
          <Badge className={cn(
            'text-xs',
            config.bg,
            config.color,
            'border-transparent'
          )}>
            {factor.severity}
          </Badge>
        </div>
        <div className="text-sm text-slate-700">
          {factor.description}
        </div>
        {factor.evidence && (
          <div className="text-xs text-slate-500">
            證據: {JSON.stringify(factor.evidence, null, 0)}
          </div>
        )}
      </div>
    </div>
  )
}