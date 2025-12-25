'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RiskGateDisplay } from '@/components/risk-gate/risk-gate-display'
import { DecisionRecordDisplay } from '@/components/decision-record/decision-record-display'
import { riskGate } from '@/lib/risk-engine/risk-gate'
import { decisionEngine } from '@/lib/decision-engine/decision-record'
import { mockJobs } from '@/lib/mock-data'
import { formatAgo, formatTwd, cn } from '@/lib/utils'
import { Job, RiskGateResult, DecisionRecord, ParticipantSignal } from '@/types'
import { ExternalLink, Shield, FileText, Users, Sparkles, AlertTriangle, UserCheck, UsersIcon, Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Utility functions for risk status styling
const getRiskStatusColor = (status: string) => {
  switch (status) {
    case 'PASS':
      return 'text-green-600'
    case 'SOFT_WARNING':
      return 'text-yellow-600'
    case 'HARD_BLOCK':
      return 'text-red-600'
    default:
      return 'text-slate-600'
  }
}

const getRiskStatusIcon = (status: string) => {
  switch (status) {
    case 'PASS':
      return '✅'
    case 'SOFT_WARNING':
      return '🟡'
    case 'HARD_BLOCK':
      return '🔴'
    default:
      return '⚪'
  }
}

export default function HomePage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [riskResults, setRiskResults] = useState<Map<string, RiskGateResult>>(new Map())
  const [decisionRecords, setDecisionRecords] = useState<DecisionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [isTeamMode, setIsTeamMode] = useState(true) // 預設為團隊模式
  const [mounted, setMounted] = useState(false) // 追蹤組件是否已掛載
  
  // 穩定的 jobs 數據，避免 hydration 錯誤
  const stableJobs = useMemo(() => mockJobs, [])

  // 確保組件在客戶端完全載入
  useEffect(() => {
    setMounted(true)
  }, [])

  // 初始化：評估所有案件的風險
  useEffect(() => {
    async function evaluateAllJobs() {
      setLoading(true)
      const results = new Map<string, RiskGateResult>()
      
      for (const job of stableJobs) {
        try {
          const result = await riskGate.evaluateJob(job)
          results.set(job.id, result)
        } catch (error) {
          console.error(`Error evaluating job ${job.id}:`, error)
        }
      }
      
      setRiskResults(results)
      setLoading(false)
    }

    if (mounted) {
      evaluateAllJobs()
    }
  }, [mounted, stableJobs])

  // 模擬創建決策記錄
  const createMockDecisionRecord = async (job: Job, outcome: 'PROCEED' | 'SKIP') => {
    const riskResult = riskResults.get(job.id)
    if (!riskResult) return

    // 模擬團隊成員信號
    const mockSignals: ParticipantSignal[] = [
      {
        userId: 'alice@team.com',
        role: 'DECISION_OWNER',
        signal: outcome === 'PROCEED' ? 'RECOMMEND' : 'REJECT',
        reasoning: {
          category: 'STRATEGIC',
          details: outcome === 'PROCEED' 
            ? '符合團隊技術方向，且風險可控' 
            : '風險太高，不符合當前策略',
          confidence: 0.8
        },
        timestamp: new Date()
      },
      {
        userId: 'bob@team.com',
        role: 'TECHNICAL_REVIEWER',
        signal: riskResult.gateStatus === 'HARD_BLOCK' ? 'REJECT' : 'CAUTION',
        reasoning: {
          category: 'TECHNICAL',
          details: '技術要求符合團隊能力，但需注意時程風險',
          confidence: 0.7
        },
        timestamp: new Date()
      },
      {
        userId: 'charlie@team.com',
        role: 'BUSINESS_REVIEWER',
        signal: job.ehrTwd && job.ehrTwd > 1500 ? 'RECOMMEND' : 'CAUTION',
        reasoning: {
          category: 'BUDGET',
          details: `有效時薪 ${job.ehrTwd ? formatTwd(job.ehrTwd) : '未知'} TWD/hr，${job.ehrTwd && job.ehrTwd > 1500 ? '符合' : '略低於'}預期`,
          confidence: 0.9
        },
        timestamp: new Date()
      }
    ]

    const record = await decisionEngine.createDecisionRecord({
      jobId: job.id,
      teamId: 'team-demo-001',
      job,
      riskAssessment: riskResult,
      participantSignals: mockSignals,
      decidedBy: 'alice@team.com',
      outcome,
      reasoning: outcome === 'PROCEED' 
        ? '綜合評估後認為風險可控，且符合團隊發展方向。建議接案但需要密切關注專案進度。'
        : '基於 Risk Gate 評估結果，此案件風險過高。建議跳過，尋找更合適的機會。',
      confidence: outcome === 'PROCEED' ? 0.75 : 0.9,
      conditions: outcome === 'PROCEED' ? ['要求預付 50% 款項', '每週進度報告', '明確技術規格書'] : undefined
    })

    setDecisionRecords(prev => [record, ...prev])
  }

  // 在組件掛載完成前顯示載入狀態
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <div className="text-slate-600">載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl shadow transition-colors",
              isTeamMode ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
            )}>
              {isTeamMode ? <Shield className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {isTeamMode ? "團隊決策風險管控平台" : "個人接案方向探索"}
              </div>
              <div className="text-xs text-slate-500">
                {isTeamMode 
                  ? "Team Decision Infrastructure · Risk Gate + Collaborative Decision" 
                  : "Personal Job Discovery · Score-based Recommendations"
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 模式切換滑塊 */}
            <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-2 shadow-sm">
              <Label htmlFor="mode-switch" className="flex items-center gap-2 text-sm font-medium">
                <UserCheck className="h-4 w-4 text-blue-600" />
                個人
              </Label>
              <Switch
                id="mode-switch"
                checked={isTeamMode}
                onCheckedChange={setIsTeamMode}
                className="data-[state=checked]:bg-slate-900"
              />
              <Label htmlFor="mode-switch" className="flex items-center gap-2 text-sm font-medium">
                <UsersIcon className="h-4 w-4 text-slate-900" />
                團隊
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {isTeamMode ? "Team MVP" : "Solo MVP"}
              </Badge>
              <Badge variant="secondary">
                評估案件：{stableJobs.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue={isTeamMode ? "jobs" : "discover"} className="space-y-6">
          {isTeamMode ? (
            // 團隊模式：專業風險管控
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white">
              <TabsTrigger value="jobs" className="rounded-2xl">
                <Shield className="mr-2 h-4 w-4" />
                Risk Gate 評估
              </TabsTrigger>
              <TabsTrigger value="decisions" className="rounded-2xl">
                <FileText className="mr-2 h-4 w-4" />
                決策記錄
              </TabsTrigger>
              <TabsTrigger value="team" className="rounded-2xl">
                <Users className="mr-2 h-4 w-4" />
                團隊協作
              </TabsTrigger>
            </TabsList>
          ) : (
            // 個人模式：簡化探索
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white">
              <TabsTrigger value="discover" className="rounded-2xl">
                <Zap className="mr-2 h-4 w-4" />
                案件探索
              </TabsTrigger>
              <TabsTrigger value="saved" className="rounded-2xl">
                <FileText className="mr-2 h-4 w-4" />
                我的收藏
              </TabsTrigger>
            </TabsList>
          )}

          {/* Risk Gate 評估頁面 */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 案件列表 */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      案件風險評估
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading ? (
                      <div className="text-center py-8 text-slate-500">
                        正在評估案件風險...
                      </div>
                    ) : (
                      stableJobs.map(job => {
                        const riskResult = riskResults.get(job.id)
                        return (
                          <JobCard
                            key={job.id}
                            job={job}
                            riskResult={riskResult}
                            selected={selectedJob?.id === job.id}
                            onSelect={() => setSelectedJob(job)}
                            onCreateDecision={(outcome) => createMockDecisionRecord(job, outcome)}
                          />
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 詳細風險評估 */}
              <div>
                {selectedJob && riskResults.get(selectedJob.id) && (
                  <RiskGateDisplay
                    result={riskResults.get(selectedJob.id)!}
                    className="sticky top-20"
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* 決策記錄頁面 */}
          <TabsContent value="decisions" className="space-y-6">
            {decisionRecords.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <div className="text-lg font-semibold text-slate-900 mb-2">尚無決策記錄</div>
                  <div className="text-slate-600 mb-4">
                    在「Risk Gate 評估」頁面中對案件做出決策，即可在此查看決策記錄。
                  </div>
                  <Button onClick={() => (document.querySelector('[value="jobs"]') as HTMLElement)?.click()}>
                    前往評估案件
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {decisionRecords.map(record => (
                  <DecisionRecordDisplay key={record.id} record={record} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* 個人模式：案件探索 */}
          <TabsContent value="discover" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 新人指引卡片 */}
              <div className="lg:col-span-1">
                <Card className="rounded-2xl border-blue-200 bg-blue-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Zap className="h-5 w-5" />
                      新人指引
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="text-blue-800">
                      <div className="font-semibold mb-1">💡 評分說明</div>
                      <div className="text-xs text-blue-700 leading-relaxed">
                        • 80+分：強烈推薦，適合新手<br/>
                        • 70+分：可考慮，需要經驗<br/>
                        • 60+分：需謹慎評估<br/>
                        • 60分以下：建議跳過
                      </div>
                    </div>
                    <div className="text-blue-800">
                      <div className="font-semibold mb-1">🎯 找工作建議</div>
                      <div className="text-xs text-blue-700 leading-relaxed">
                        • 優先選擇遠端工作<br/>
                        • 關注技能匹配度<br/>
                        • 避免競爭過於激烈的案件<br/>
                        • 重視有效時薪
                      </div>
                    </div>
                    <div className="text-blue-800">
                      <div className="font-semibold mb-1">⚠️ 新人避坑</div>
                      <div className="text-xs text-blue-700 leading-relaxed">
                        • 避免模糊不清的需求<br/>
                        • 不接受無預付款項目<br/>
                        • 警惕超低價項目<br/>
                        • 要求明確的驗收標準
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 案件推薦列表 */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      為你推薦的案件
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stableJobs
                      .sort((a, b) => b.score - a.score) // 按分數排序
                      .map(job => (
                        <PersonalJobCard
                          key={job.id}
                          job={job}
                          onSave={() => {/* TODO: 實現收藏功能 */}}
                          onView={() => setSelectedJob(job)}
                        />
                      ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 個人模式：我的收藏 */}
          <TabsContent value="saved" className="space-y-6">
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <div className="text-lg font-semibold text-slate-900 mb-2">尚未收藏任何案件</div>
                <div className="text-slate-600 mb-4">
                  在「案件探索」頁面中收藏感興趣的案件，即可在此集中查看。
                </div>
                <Button onClick={() => (document.querySelector('[value="discover"]') as HTMLElement)?.click()}>
                  去探索案件
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 團隊協作頁面 */}
          <TabsContent value="team" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  團隊協作功能（開發中）
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 rounded-xl bg-blue-50 text-blue-900">
                  <div className="font-semibold mb-2">🚧 功能開發中</div>
                  <div className="text-sm space-y-2">
                    <p>團隊協作功能將包含：</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>團隊成員管理與權限設定</li>
                      <li>即時協作評估介面</li>
                      <li>通知與提醒系統</li>
                      <li>決策工作流程管理</li>
                      <li>團隊決策品質分析</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface JobCardProps {
  job: Job
  riskResult?: RiskGateResult
  selected: boolean
  onSelect: () => void
  onCreateDecision: (outcome: 'PROCEED' | 'SKIP') => void
}

function JobCard({ job, riskResult, selected, onSelect, onCreateDecision }: JobCardProps) {
  return (
    <Card className={cn(
      'rounded-2xl cursor-pointer transition-all border-2',
      selected 
        ? 'border-slate-900 shadow-lg' 
        : 'border-slate-200 hover:border-slate-300'
    )}>
      <CardContent className="p-4" onClick={onSelect}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            {/* 標題與基本資訊 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {job.sourceKey.toUpperCase()}
                </Badge>
                <Badge variant={job.remote ? "secondary" : "outline"} className="text-xs">
                  {job.remote ? "遠端" : "非遠端"}
                </Badge>
                <Badge variant="outline" className="text-xs">{job.category}</Badge>
                <span className="text-xs text-slate-500">{formatAgo(job.postedAt, false)}</span>
              </div>
              
              <h3 className="font-semibold text-slate-900 text-sm leading-relaxed">
                {job.title}
              </h3>
              
              <div className="flex flex-wrap gap-1">
                {job.skills.slice(0, 4).map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.skills.length - 4}
                  </Badge>
                )}
              </div>
            </div>

            {/* Risk Gate 狀態 */}
            {riskResult && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Risk Gate:</span>
                <span className={cn(
                  'font-medium flex items-center gap-1',
                  getRiskStatusColor(riskResult.gateStatus)
                )}>
                  {getRiskStatusIcon(riskResult.gateStatus)}
                  {riskResult.gateStatus.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          {/* 右側資訊與操作 */}
          <div className="flex flex-col items-end gap-3">
            {/* 分數與時薪 */}
            <div className="text-right space-y-1">
              <div className="text-lg font-bold text-slate-900">
                {job.score}
              </div>
              <div className="text-xs text-slate-600">
                {job.ehrTwd ? `${formatTwd(job.ehrTwd)} TWD/hr` : '時薪未明'}
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onCreateDecision('PROCEED')}
                className="text-xs px-3 rounded-xl"
              >
                ✅ 接案
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onCreateDecision('SKIP')}
                className="text-xs px-3 rounded-xl"
              >
                ❌ 跳過
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(job.url, '_blank')}
                className="text-xs px-2 rounded-xl"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 個人模式的簡化案件卡片
interface PersonalJobCardProps {
  job: Job
  onSave: () => void
  onView: () => void
}

function PersonalJobCard({ job, onSave, onView }: PersonalJobCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '🌟 強烈推薦'
    if (score >= 70) return '👍 可以考慮'
    if (score >= 60) return '⚠️ 需謹慎'
    return '❌ 建議跳過'
  }

  return (
    <Card className="rounded-2xl hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* 標題與基本資訊 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {job.sourceKey.toUpperCase()}
                </Badge>
                {job.remote ? (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    🏠 遠端工作
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-gray-600">
                    🏢 非遠端
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">{job.category}</Badge>
                <span className="text-xs text-slate-500">{formatAgo(job.postedAt, false)}</span>
              </div>
              
              <h3 className="font-semibold text-slate-900 text-sm leading-relaxed cursor-pointer hover:text-blue-600" 
                  onClick={onView}>
                {job.title}
              </h3>
              
              {/* 技能標籤 */}
              <div className="flex flex-wrap gap-1">
                {job.skills.slice(0, 5).map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.skills.length - 5}
                  </Badge>
                )}
              </div>

              {/* 推薦理由 */}
              <div className="text-xs text-slate-600">
                <span className="font-medium">推薦理由：</span>
                <span className="ml-1">{job.reasonsTop.slice(0, 2).join('、')}</span>
              </div>
            </div>
          </div>

          {/* 右側：分數與操作 */}
          <div className="flex flex-col items-end gap-3">
            {/* 評分卡片 */}
            <div className={cn(
              "rounded-xl border px-3 py-2 text-center min-w-[100px]",
              getScoreColor(job.score)
            )}>
              <div className="text-2xl font-bold">
                {job.score}
              </div>
              <div className="text-xs font-medium">
                {getScoreLabel(job.score)}
              </div>
            </div>

            {/* 時薪資訊 */}
            {job.ehrTwd && (
              <div className="text-right">
                <div className="text-xs text-slate-500">有效時薪</div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatTwd(job.ehrTwd)} TWD/hr
                </div>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={onSave}
                className="text-xs px-3 rounded-xl"
              >
                ⭐ 收藏
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(job.url, '_blank')}
                className="text-xs px-2 rounded-xl"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
