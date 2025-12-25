// 核心資料型別定義

export type SourceKey = "wwr" | "yourator"

export interface Job {
  id: string
  sourceKey: SourceKey
  title: string
  url: string
  postedAt: string // ISO
  category: string
  skills: string[]
  remote: boolean
  applicantsMin?: number
  applicantsMax?: number
  ehrTwd?: number // effective hourly rate in TWD
  score: number // 0-100
  reasonsTop: string[]
  breakdown: {
    P: number // reward
    Fit: number
    Q: number
    R: number
    Comp: number
  }
  reasonsPositive: string[]
  reasonsNegative: string[]
  fxAsOf: string
}

// Risk Gate 相關型別
export type RiskGateStatus = 'PASS' | 'SOFT_WARNING' | 'HARD_BLOCK'
export type RiskRecommendation = 'PROCEED' | 'REVIEW_CAREFULLY' | 'DO_NOT_PROCEED'

export interface RiskFactor {
  type: 'COMPETITION' | 'BUDGET' | 'SCOPE' | 'TIMELINE' | 'FRAUD_SIGNAL'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  evidence: any
}

export interface RiskGateResult {
  gateStatus: RiskGateStatus
  riskFactors: RiskFactor[]
  recommendation: RiskRecommendation
  explanation: string[]
  score: number // 風險分數 (0-1)
}

// Team & Decision Record 相關型別
export type TeamRole = 'DECISION_OWNER' | 'TECHNICAL_REVIEWER' | 'BUSINESS_REVIEWER' | 'RISK_REVIEWER'
export type SignalType = 'RECOMMEND' | 'CAUTION' | 'REJECT'
export type DecisionOutcome = 'PROCEED' | 'SKIP' | 'DEFER'

export interface Team {
  id: string
  name: string
  description?: string
  settings?: any
  createdAt: Date
}

export interface TeamMember {
  teamId: string
  userId: string
  role: TeamRole
  permissions: string[]
  joinedAt: Date
}

export interface MemberSignal {
  id: string
  teamJobId: string
  userId: string
  signal: SignalType
  reasoning: {
    category: 'BUDGET' | 'SCOPE' | 'TIMELINE' | 'TECHNICAL' | 'STRATEGIC'
    details: string
    confidence: number // 0-1
  }
  submittedAt: Date
}

export interface DecisionRecord {
  id: string
  decisionId: string // DR-2024-001 格式
  jobId: string
  teamId?: string
  
  context: {
    jobTitle: string
    budget: string
    timeline: string
    riskAssessment: RiskGateResult
  }
  
  participants: ParticipantSignal[]
  decision: {
    outcome: DecisionOutcome
    confidence: number
    conditions?: string[]
    decidedBy: string
    reasoning: string
  }
  
  followUp?: {
    reviewDate: Date
    actualOutcome?: string
    lessonsLearned?: string
  }
  
  createdAt: Date
  updatedAt: Date
}

export interface ParticipantSignal {
  userId: string
  role: TeamRole
  signal: SignalType
  reasoning: {
    category: 'BUDGET' | 'SCOPE' | 'TIMELINE' | 'TECHNICAL' | 'STRATEGIC'
    details: string
    confidence: number
  }
  timestamp: Date
}