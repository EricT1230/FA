import { DecisionRecord, ParticipantSignal, SignalType, DecisionOutcome, RiskGateResult, Job } from '@/types'

export interface CreateDecisionRecordInput {
  jobId: string
  teamId: string
  job: Job
  riskAssessment: RiskGateResult
  participantSignals: ParticipantSignal[]
  decidedBy: string
  outcome: DecisionOutcome
  reasoning: string
  confidence: number
  conditions?: string[]
}

export class DecisionRecordEngine {
  /**
   * 生成唯一的決策記錄 ID
   */
  private generateDecisionId(): string {
    const year = new Date().getFullYear()
    const sequence = Math.floor(Math.random() * 999) + 1
    return `DR-${year}-${sequence.toString().padStart(3, '0')}`
  }

  /**
   * 創建決策記錄
   */
  async createDecisionRecord(input: CreateDecisionRecordInput): Promise<DecisionRecord> {
    const now = new Date()
    
    const record: DecisionRecord = {
      id: `decision-${Date.now()}`,
      decisionId: this.generateDecisionId(),
      jobId: input.jobId,
      teamId: input.teamId,
      
      context: {
        jobTitle: input.job.title,
        budget: input.job.ehrTwd ? `TWD ${input.job.ehrTwd}/hr` : '未明確',
        timeline: this.extractTimeline(input.job),
        riskAssessment: input.riskAssessment
      },
      
      participants: input.participantSignals,
      
      decision: {
        outcome: input.outcome,
        confidence: input.confidence,
        conditions: input.conditions,
        decidedBy: input.decidedBy,
        reasoning: input.reasoning
      },
      
      createdAt: now,
      updatedAt: now
    }

    // 在真實系統中，這裡會保存到資料庫
    return record
  }

  /**
   * 更新決策記錄的後續追蹤
   */
  async updateFollowUp(
    recordId: string,
    followUp: {
      actualOutcome?: string
      lessonsLearned?: string
    }
  ): Promise<DecisionRecord | null> {
    // 在真實系統中，這裡會從資料庫讀取並更新
    // 目前返回 null 作為示例
    return null
  }

  /**
   * 分析團隊信號分佈
   */
  analyzeSignalDistribution(signals: ParticipantSignal[]): {
    recommend: number
    caution: number
    reject: number
    consensus: 'STRONG_AGREEMENT' | 'MAJORITY' | 'SPLIT' | 'NO_CONSENSUS'
  } {
    const counts = {
      recommend: signals.filter(s => s.signal === 'RECOMMEND').length,
      caution: signals.filter(s => s.signal === 'CAUTION').length,
      reject: signals.filter(s => s.signal === 'REJECT').length
    }

    const total = signals.length
    const maxCount = Math.max(counts.recommend, counts.caution, counts.reject)
    const maxPercentage = maxCount / total

    let consensus: 'STRONG_AGREEMENT' | 'MAJORITY' | 'SPLIT' | 'NO_CONSENSUS'
    
    if (maxPercentage >= 0.8) {
      consensus = 'STRONG_AGREEMENT'
    } else if (maxPercentage >= 0.6) {
      consensus = 'MAJORITY'
    } else if (maxPercentage >= 0.4) {
      consensus = 'SPLIT'
    } else {
      consensus = 'NO_CONSENSUS'
    }

    return { ...counts, consensus }
  }

  /**
   * 生成決策總結
   */
  generateDecisionSummary(
    decision: DecisionRecord,
    signalAnalysis: ReturnType<typeof this.analyzeSignalDistribution>
  ): string {
    const { outcome, confidence } = decision.decision
    const { consensus } = signalAnalysis

    let summary = `決策：${this.translateOutcome(outcome)} (信心度: ${Math.round(confidence * 100)}%)\n`
    
    summary += `團隊共識：${this.translateConsensus(consensus)}\n`
    
    if (decision.context.riskAssessment.gateStatus !== 'PASS') {
      summary += `Risk Gate 狀態：${this.translateRiskStatus(decision.context.riskAssessment.gateStatus)}\n`
    }

    summary += `主要考量：${decision.decision.reasoning}`

    return summary
  }

  /**
   * 生成決策理由模板
   */
  generateReasoningTemplate(
    riskAssessment: RiskGateResult,
    signalAnalysis: ReturnType<typeof this.analyzeSignalDistribution>,
    outcome: DecisionOutcome
  ): string[] {
    const templates: string[] = []

    // 基於 Risk Gate 結果的模板
    if (riskAssessment.gateStatus === 'HARD_BLOCK' && outcome === 'PROCEED') {
      templates.push('儘管 Risk Gate 顯示高風險，但團隊評估...')
    } else if (riskAssessment.gateStatus === 'PASS' && outcome === 'SKIP') {
      templates.push('雖然風險可控，但基於策略考量...')
    }

    // 基於團隊共識的模板
    if (signalAnalysis.consensus === 'STRONG_AGREEMENT') {
      templates.push('團隊一致認為...')
    } else if (signalAnalysis.consensus === 'SPLIT') {
      templates.push('團隊意見分歧，最終決定基於...')
    }

    // 基於主要風險因素的模板
    const criticalRisks = riskAssessment.riskFactors.filter(f => f.severity === 'CRITICAL')
    if (criticalRisks.length > 0) {
      templates.push(`考慮到關鍵風險因素（${criticalRisks.map(r => r.type).join('、')}）...`)
    }

    return templates
  }

  private extractTimeline(job: Job): string {
    // 簡單的時程提取邏輯
    if (/urgent|asap|immediately/i.test(job.title)) {
      return '緊急'
    }
    
    const weekMatch = job.title.match(/(\d+)\s*week/i)
    if (weekMatch) {
      return `${weekMatch[1]} 週`
    }
    
    const monthMatch = job.title.match(/(\d+)\s*month/i)
    if (monthMatch) {
      return `${monthMatch[1]} 月`
    }
    
    return '未明確'
  }

  private translateOutcome(outcome: DecisionOutcome): string {
    const translations = {
      'PROCEED': '接案',
      'SKIP': '跳過',
      'DEFER': '延期決定'
    }
    return translations[outcome]
  }

  private translateConsensus(consensus: string): string {
    const translations: Record<string, string> = {
      'STRONG_AGREEMENT': '高度一致',
      'MAJORITY': '多數同意',
      'SPLIT': '意見分歧',
      'NO_CONSENSUS': '無共識'
    }
    return translations[consensus] || consensus
  }

  private translateRiskStatus(status: string): string {
    const translations: Record<string, string> = {
      'PASS': '通過',
      'SOFT_WARNING': '需謹慎',
      'HARD_BLOCK': '高風險'
    }
    return translations[status] || status
  }
}

// 導出單例實例
export const decisionEngine = new DecisionRecordEngine()