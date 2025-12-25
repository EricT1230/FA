import { Job, RiskGateResult, RiskFactor, RiskGateStatus, RiskRecommendation } from '@/types'

interface RiskGateConfig {
  hardBlockThresholds: {
    maxApplicants: number
    minDescriptionLength: number
    budgetStdDeviations: number
  }
  softWarningThresholds: {
    maxApplicants: number
    minDescriptionLength: number
    budgetVarianceRatio: number
  }
  fraudSignals: string[]
  urgentKeywords: string[]
  riskKeywords: string[]
}

const DEFAULT_CONFIG: RiskGateConfig = {
  hardBlockThresholds: {
    maxApplicants: 50,
    minDescriptionLength: 100,
    budgetStdDeviations: 3
  },
  softWarningThresholds: {
    maxApplicants: 20,
    minDescriptionLength: 200,
    budgetVarianceRatio: 2
  },
  fraudSignals: [
    'test project',
    'urgent payment',
    'pay first',
    'advance payment',
    'no experience required',
    'easy money'
  ],
  urgentKeywords: [
    'urgent',
    'asap',
    'rush',
    'immediately',
    'emergency',
    '急件',
    '緊急',
    '火速'
  ],
  riskKeywords: [
    'undefined scope',
    'flexible requirements',
    'we will decide later',
    'simple project',
    'quick job',
    '簡單項目',
    '範圍不明',
    '彈性需求'
  ]
}

export class RiskGateEngine {
  private config: RiskGateConfig

  constructor(config: Partial<RiskGateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 執行 Risk Gate 評估
   */
  async evaluateJob(job: Job): Promise<RiskGateResult> {
    const riskFactors: RiskFactor[] = []

    // 1. 檢查競爭度
    const competitionRisk = this.evaluateCompetition(job)
    if (competitionRisk) riskFactors.push(competitionRisk)

    // 2. 檢查預算風險
    const budgetRisk = this.evaluateBudget(job)
    if (budgetRisk) riskFactors.push(budgetRisk)

    // 3. 檢查範圍清晰度
    const scopeRisk = this.evaluateScope(job)
    if (scopeRisk) riskFactors.push(scopeRisk)

    // 4. 檢查時程風險
    const timelineRisk = this.evaluateTimeline(job)
    if (timelineRisk) riskFactors.push(timelineRisk)

    // 5. 檢查詐騙信號
    const fraudRisk = this.evaluateFraudSignals(job)
    if (fraudRisk) riskFactors.push(fraudRisk)

    // 計算最終風險等級和建議
    const { gateStatus, recommendation } = this.calculateRiskLevel(riskFactors)
    const explanation = this.generateExplanation(riskFactors, gateStatus)
    const riskScore = this.calculateRiskScore(riskFactors)

    return {
      gateStatus,
      riskFactors,
      recommendation,
      explanation,
      score: riskScore
    }
  }

  /**
   * 評估競爭度風險
   */
  private evaluateCompetition(job: Job): RiskFactor | null {
    const applicantsMid = job.applicantsMin && job.applicantsMax 
      ? Math.round((job.applicantsMin + job.applicantsMax) / 2)
      : null

    if (!applicantsMid) {
      return {
        type: 'COMPETITION',
        severity: 'LOW',
        description: '競爭度資料缺失，使用保守估算',
        evidence: { applicantsMid: null, source: job.sourceKey }
      }
    }

    if (applicantsMid >= this.config.hardBlockThresholds.maxApplicants) {
      return {
        type: 'COMPETITION',
        severity: 'CRITICAL',
        description: `競爭過度激烈（已有 ${applicantsMid}+ 申請者）`,
        evidence: { applicantsMid, threshold: this.config.hardBlockThresholds.maxApplicants }
      }
    }

    if (applicantsMid >= this.config.softWarningThresholds.maxApplicants) {
      return {
        type: 'COMPETITION',
        severity: 'HIGH',
        description: `競爭激烈（已有 ${applicantsMid} 申請者）`,
        evidence: { applicantsMid, threshold: this.config.softWarningThresholds.maxApplicants }
      }
    }

    return null
  }

  /**
   * 評估預算風險
   */
  private evaluateBudget(job: Job): RiskFactor | null {
    // 檢查預算範圍是否異常寬泛
    if (job.applicantsMin && job.applicantsMax) {
      const range = job.applicantsMax - job.applicantsMin
      const mid = (job.applicantsMin + job.applicantsMax) / 2
      const varianceRatio = range / mid

      if (varianceRatio > this.config.softWarningThresholds.budgetVarianceRatio) {
        return {
          type: 'BUDGET',
          severity: 'MEDIUM',
          description: `預算範圍過於模糊（變異比 ${varianceRatio.toFixed(1)}）`,
          evidence: { range, mid, varianceRatio }
        }
      }
    }

    // 檢查有效時薪是否異常
    if (job.ehrTwd) {
      if (job.ehrTwd < 500) {
        return {
          type: 'BUDGET',
          severity: 'HIGH',
          description: `有效時薪過低（TWD ${job.ehrTwd}/hr）`,
          evidence: { ehrTwd: job.ehrTwd }
        }
      }
      
      if (job.ehrTwd > 5000) {
        return {
          type: 'BUDGET',
          severity: 'MEDIUM',
          description: `有效時薪異常高（TWD ${job.ehrTwd}/hr），請確認真實性`,
          evidence: { ehrTwd: job.ehrTwd }
        }
      }
    }

    return null
  }

  /**
   * 評估需求範圍清晰度
   */
  private evaluateScope(job: Job): RiskFactor | null {
    const titleLength = job.title.length
    const hasDeliverables = /交付|deliverable|outcome|result/i.test(job.title)
    const hasVagueTerms = this.config.riskKeywords.some(keyword => 
      job.title.toLowerCase().includes(keyword.toLowerCase())
    )

    if (titleLength < this.config.hardBlockThresholds.minDescriptionLength) {
      return {
        type: 'SCOPE',
        severity: 'CRITICAL',
        description: `需求描述過於簡略（僅 ${titleLength} 字）`,
        evidence: { titleLength, threshold: this.config.hardBlockThresholds.minDescriptionLength }
      }
    }

    if (titleLength < this.config.softWarningThresholds.minDescriptionLength) {
      return {
        type: 'SCOPE',
        severity: 'HIGH',
        description: `需求描述不夠詳細（${titleLength} 字）`,
        evidence: { titleLength, threshold: this.config.softWarningThresholds.minDescriptionLength }
      }
    }

    if (hasVagueTerms) {
      return {
        type: 'SCOPE',
        severity: 'MEDIUM',
        description: '包含模糊需求關鍵字',
        evidence: { hasVagueTerms, detectedTerms: this.config.riskKeywords.filter(k => job.title.toLowerCase().includes(k.toLowerCase())) }
      }
    }

    if (!hasDeliverables) {
      return {
        type: 'SCOPE',
        severity: 'LOW',
        description: '未明確提及交付物或成果',
        evidence: { hasDeliverables }
      }
    }

    return null
  }

  /**
   * 評估時程風險
   */
  private evaluateTimeline(job: Job): RiskFactor | null {
    const hasUrgentKeywords = this.config.urgentKeywords.some(keyword => 
      job.title.toLowerCase().includes(keyword.toLowerCase())
    )

    if (hasUrgentKeywords) {
      return {
        type: 'TIMELINE',
        severity: 'HIGH',
        description: '包含緊急時程關鍵字',
        evidence: { 
          hasUrgentKeywords, 
          detectedTerms: this.config.urgentKeywords.filter(k => job.title.toLowerCase().includes(k.toLowerCase()))
        }
      }
    }

    // 檢查發布時間（如果是很久以前發布的，可能有問題）
    const postedDate = new Date(job.postedAt)
    const daysSincePosted = (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSincePosted > 30) {
      return {
        type: 'TIMELINE',
        severity: 'MEDIUM',
        description: `案件發布已超過 ${Math.round(daysSincePosted)} 天，可能已過時`,
        evidence: { daysSincePosted, postedAt: job.postedAt }
      }
    }

    return null
  }

  /**
   * 評估詐騙信號
   */
  private evaluateFraudSignals(job: Job): RiskFactor | null {
    const suspiciousTerms = this.config.fraudSignals.filter(signal => 
      job.title.toLowerCase().includes(signal.toLowerCase())
    )

    if (suspiciousTerms.length > 0) {
      return {
        type: 'FRAUD_SIGNAL',
        severity: 'CRITICAL',
        description: `包含可疑關鍵字：${suspiciousTerms.join(', ')}`,
        evidence: { suspiciousTerms }
      }
    }

    return null
  }

  /**
   * 計算最終風險等級
   */
  private calculateRiskLevel(riskFactors: RiskFactor[]): { gateStatus: RiskGateStatus, recommendation: RiskRecommendation } {
    const criticalCount = riskFactors.filter(f => f.severity === 'CRITICAL').length
    const highCount = riskFactors.filter(f => f.severity === 'HIGH').length
    const mediumCount = riskFactors.filter(f => f.severity === 'MEDIUM').length

    // Hard Block 條件
    if (criticalCount > 0 || highCount >= 2) {
      return {
        gateStatus: 'HARD_BLOCK',
        recommendation: 'DO_NOT_PROCEED'
      }
    }

    // Soft Warning 條件  
    if (highCount > 0 || mediumCount >= 2) {
      return {
        gateStatus: 'SOFT_WARNING',
        recommendation: 'REVIEW_CAREFULLY'
      }
    }

    // 通過
    return {
      gateStatus: 'PASS',
      recommendation: 'PROCEED'
    }
  }

  /**
   * 生成風險解釋
   */
  private generateExplanation(riskFactors: RiskFactor[], gateStatus: RiskGateStatus): string[] {
    const explanation: string[] = []

    if (gateStatus === 'HARD_BLOCK') {
      explanation.push('🔴 不建議投遞 - 此案件存在高風險')
    } else if (gateStatus === 'SOFT_WARNING') {
      explanation.push('🟡 謹慎評估 - 此案件存在中等風險')
    } else {
      explanation.push('✅ 可以投遞 - 風險在可接受範圍內')
    }

    // 添加主要風險因素
    if (riskFactors.length > 0) {
      explanation.push('')
      explanation.push('主要風險因素：')
      riskFactors.slice(0, 3).forEach(factor => {
        explanation.push(`• ${factor.description}`)
      })
    }

    // 添加建議行動
    explanation.push('')
    switch (gateStatus) {
      case 'HARD_BLOCK':
        explanation.push('建議行動：跳過此案件')
        break
      case 'SOFT_WARNING':
        explanation.push('建議行動：仔細評估風險後決定')
        break
      case 'PASS':
        explanation.push('建議行動：可正常進行投遞流程')
        break
    }

    return explanation
  }

  /**
   * 計算風險分數 (0-1)
   */
  private calculateRiskScore(riskFactors: RiskFactor[]): number {
    const weights = {
      'CRITICAL': 0.8,
      'HIGH': 0.6,
      'MEDIUM': 0.4,
      'LOW': 0.2
    }

    const totalWeight = riskFactors.reduce((sum, factor) => {
      return sum + weights[factor.severity]
    }, 0)

    // 正規化到 0-1 範圍
    return Math.min(totalWeight / 2, 1)
  }
}

// 導出單例實例
export const riskGate = new RiskGateEngine()