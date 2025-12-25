'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Users, ThumbsUp, AlertTriangle, ThumbsDown, Clock, User } from 'lucide-react'
import { DecisionRecord, ParticipantSignal } from '@/types'
import { cn } from '@/lib/utils'

interface DecisionRecordDisplayProps {
  record: DecisionRecord
  className?: string
  onEdit?: () => void
}

export function DecisionRecordDisplay({ record, className, onEdit }: DecisionRecordDisplayProps) {
  const outcomeConfig = {
    'PROCEED': {
      color: 'text-green-700',
      bg: 'bg-green-100',
      icon: '✅',
      label: '接案'
    },
    'SKIP': {
      color: 'text-red-700', 
      bg: 'bg-red-100',
      icon: '❌',
      label: '跳過'
    },
    'DEFER': {
      color: 'text-yellow-700',
      bg: 'bg-yellow-100', 
      icon: '⏸️',
      label: '延期'
    }
  }

  const config = outcomeConfig[record.decision.outcome]

  return (
    <Card className={cn('rounded-2xl', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              決策記錄 #{record.decisionId}
            </CardTitle>
            <div className="text-sm text-slate-600">
              {record.context.jobTitle}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(
              'text-sm font-semibold',
              config.bg,
              config.color
            )}>
              {config.icon} {config.label}
            </Badge>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                編輯
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 決策概要 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {Math.round(record.decision.confidence * 100)}%
            </div>
            <div className="text-sm text-slate-600">信心度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {record.participants.length}
            </div>
            <div className="text-sm text-slate-600">參與評估</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {record.context.riskAssessment.riskFactors.length}
            </div>
            <div className="text-sm text-slate-600">風險因素</div>
          </div>
        </div>

        {/* 案件背景 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">案件背景</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-600">預算</div>
              <div className="text-slate-900">{record.context.budget}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600">時程</div>
              <div className="text-slate-900">{record.context.timeline}</div>
            </div>
          </div>
        </div>

        {/* 團隊評估信號 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4" />
            團隊評估信號
          </h3>
          <div className="space-y-3">
            {record.participants.map((participant, index) => (
              <ParticipantSignalCard key={index} signal={participant} />
            ))}
          </div>
          <SignalSummary signals={record.participants} />
        </div>

        {/* 決策理由 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">決策理由</h3>
          <div className="p-4 rounded-xl border bg-white">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">
                決策者：{record.decision.decidedBy}
              </span>
              <span className="text-sm text-slate-500">
                {new Date(record.createdAt).toLocaleString('zh-TW')}
              </span>
            </div>
            <div className="text-slate-900">
              {record.decision.reasoning}
            </div>
            {record.decision.conditions && record.decision.conditions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-sm font-medium text-slate-600 mb-2">附加條件：</div>
                <ul className="list-disc list-inside space-y-1">
                  {record.decision.conditions.map((condition, index) => (
                    <li key={index} className="text-sm text-slate-700">{condition}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 後續追蹤 */}
        {record.followUp && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              後續追蹤
            </h3>
            <div className="p-4 rounded-xl border bg-blue-50">
              {record.followUp.actualOutcome && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-blue-800">實際結果：</div>
                  <div className="text-blue-900">{record.followUp.actualOutcome}</div>
                </div>
              )}
              {record.followUp.lessonsLearned && (
                <div>
                  <div className="text-sm font-medium text-blue-800">經驗學習：</div>
                  <div className="text-blue-900">{record.followUp.lessonsLearned}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ParticipantSignalCardProps {
  signal: ParticipantSignal
}

function ParticipantSignalCard({ signal }: ParticipantSignalCardProps) {
  const signalConfig = {
    'RECOMMEND': {
      icon: ThumbsUp,
      color: 'text-green-700',
      bg: 'bg-green-100',
      label: '推薦'
    },
    'CAUTION': {
      icon: AlertTriangle,
      color: 'text-yellow-700',
      bg: 'bg-yellow-100',
      label: '謹慎'
    },
    'REJECT': {
      icon: ThumbsDown,
      color: 'text-red-700',
      bg: 'bg-red-100',
      label: '反對'
    }
  }

  const config = signalConfig[signal.signal]
  const SignalIcon = config.icon

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border bg-white">
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full',
        config.bg
      )}>
        <SignalIcon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{signal.userId}</span>
          <Badge variant="outline" className="text-xs">
            {signal.role.replace('_', ' ')}
          </Badge>
          <Badge className={cn('text-xs', config.bg, config.color)}>
            {config.label}
          </Badge>
        </div>
        <div className="text-sm text-slate-700">
          {signal.reasoning.details}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>分類：{signal.reasoning.category}</span>
          <span>信心度：{Math.round(signal.reasoning.confidence * 100)}%</span>
          <span>{new Date(signal.timestamp).toLocaleString('zh-TW')}</span>
        </div>
      </div>
    </div>
  )
}

interface SignalSummaryProps {
  signals: ParticipantSignal[]
}

function SignalSummary({ signals }: SignalSummaryProps) {
  const counts = {
    recommend: signals.filter(s => s.signal === 'RECOMMEND').length,
    caution: signals.filter(s => s.signal === 'CAUTION').length,
    reject: signals.filter(s => s.signal === 'REJECT').length
  }

  const total = signals.length
  
  return (
    <div className="p-4 rounded-xl bg-slate-100">
      <div className="text-sm font-medium text-slate-900 mb-3">信號分佈</div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-green-700">{counts.recommend}</div>
          <div className="text-xs text-green-600">推薦</div>
          <div className="text-xs text-slate-500">
            {total > 0 ? Math.round((counts.recommend / total) * 100) : 0}%
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-yellow-700">{counts.caution}</div>
          <div className="text-xs text-yellow-600">謹慎</div>
          <div className="text-xs text-slate-500">
            {total > 0 ? Math.round((counts.caution / total) * 100) : 0}%
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-red-700">{counts.reject}</div>
          <div className="text-xs text-red-600">反對</div>
          <div className="text-xs text-slate-500">
            {total > 0 ? Math.round((counts.reject / total) * 100) : 0}%
          </div>
        </div>
      </div>
    </div>
  )
}