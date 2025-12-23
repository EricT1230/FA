````md
# 接案彙總評分平台（Yourator + We Work Remotely）  
## 系統架構書（SAD）暨企劃書（PRD/Project Plan） v1.0（MVP）

- 文件狀態：可開工（Ready for Development）
- 版本：v1.0
- 目標：以 **TWD 為預設基準**，彙總多平台案件，進行 **性價比評分（含已投稿人數）**、個人化推薦與通知
- MVP 來源：**Yourator（API） + We Work Remotely（RSS）**
- 技術框架：**Next.js（Web + API）/ Node.js Workers / PostgreSQL / Redis（Queue+Cache）**
- 時區：Asia/Taipei（台北）

---

## 目錄
1. 企劃書（PRD）
   - 1.1 背景與問題
   - 1.2 產品願景與目標
   - 1.3 MVP 範圍與非範圍
   - 1.4 使用者與使用情境
   - 1.5 成功指標（KPI）
   - 1.6 風險與合規策略
2. 系統架構書（SAD）
   - 2.1 架構總覽
   - 2.2 元件與責任邊界
   - 2.3 資料流與工作流
   - 2.4 資料模型（ERD、表設計）
   - 2.5 匯率（FX）設計（TWD 基準 + 多幣別顯示 + 快照追溯）
   - 2.6 正規化（Normalization）與估工（固定價→有效時薪）
   - 2.7 評分引擎（Scoring v1，含已投稿人數）
   - 2.8 推薦與通知
   - 2.9 API 規格（BFF）
   - 2.10 後台（Admin）與營運
   - 2.11 安全、權限、可觀測性、維運
   - 2.12 測試策略與驗收
3. 路線圖與規劃表（WBS + Milestones）
4. 附件（完整可開工）
   - 附件 A：ERD（文字版）+ Prisma Schema（含索引建議）
   - 附件 B：介面規格（Connector 契約 / Queue Payload / API Request-Response）
   - 附件 C：Taxonomy v1（類別統一）與 Skill 字典 v1
   - 附件 D：預算解析（Budget Parse）與估工規則表 v1
   - 附件 E：Scoring v1 設定檔（權重、缺值策略、理由模板）
   - 附件 F：部署與環境變數（Docker Compose/Env）
   - 附件 G：Runbook（常見故障排除與操作手冊）
   - 附件 H：驗收清單（Definition of Done / UAT Checklist）

---

# 1. 企劃書（PRD）

## 1.1 背景與問題
接案者通常需要跨多平台尋找案件，面臨：
- 案件分散、規格不一（類別、技能、預算呈現方式不同）
- 無法快速衡量「划算程度」（固定價/時薪/幣別不同）
- 競爭程度不透明（已投稿人數、熱門程度）
- 需要反覆手動篩選、比較、收藏、追蹤，效率低

本產品提供「彙總、正規化、評分、推薦、通知」的一站式決策系統。

---

## 1.2 產品願景與目標
### 願景
以「可解釋的評分」協助使用者快速找到「最值得投遞」的案件，而不是只是堆列表。

### 目標（MVP）
1. 自動彙總 Yourator + WWR 案件並去重/更新
2. 以 **TWD** 作為基準貨幣，做匯率快照與多幣別顯示
3. 建立「性價比分數 v1」，納入 **已投稿人數（競爭度懲罰）**
4. 提供個人化 Profile 與推薦清單
5. 提供每日摘要/條件觸發通知
6. 管理後台可監控來源、調整權重、快速停用來源

---

## 1.3 MVP 範圍與非範圍
### MVP 範圍（In Scope）
- 來源：Yourator（API v4）+ WWR（RSS）
- Pipeline：ingest → raw store → normalize → score → serve
- 正規化：預算解析、幣別換算、類別統一、技能抽取、摘要生成
- 評分：Scoring v1（含投稿人數）
- Web：案件列表/詳情/篩選/排序、收藏/忽略、Profile、顯示幣別切換
- 通知：每日 Top N + 立即觸發（簡化規則）
- 後台：來源監控、啟用/停用、權重調整

### 非範圍（Out of Scope）
- 自動投遞/代使用者在平台投稿
- 對禁爬平台做 HTML 爬取（無授權不做）
- Learning-to-Rank / 自動訓練（v2）
- 複雜布林條件查詢（v1 先簡化）

---

## 1.4 使用者與使用情境（User Stories）
### 角色
- 接案者（主要）
- 管理者（營運/維運）

### 核心使用者故事
- US-01：我想看到最新案件，並依「分數/有效時薪/新鮮度」排序
- US-02：我想設定技能與底線，系統只推薦我有可能拿下且划算的案子
- US-03：我想看到「為什麼推薦/為什麼扣分」（含競爭度）
- US-04：我想收藏/忽略案件，避免重複浪費時間
- US-05：我想每天早上收到 Top 10
- US-06：管理者想看到各來源抓取成功率/失敗率，可一鍵停用

---

## 1.5 成功指標（KPI）
MVP 以可用性與效率提升為主：
- KPI-01：每日新增可用案件數（去重後）≥ 目標值（依來源量調整）
- KPI-02：API 列表查詢 p95 < 500ms（一般條件）
- KPI-03：通知重複率（同條件同案件）≈ 0（依防重唯一鍵）
- KPI-04：使用者行為：收藏率、點擊導出率、忽略率（作為推薦品質回饋）
- KPI-05：來源抓取成功率 ≥ 95%（排除來源故障期）

---

## 1.6 風險與合規策略
### 合規總則
- 只整合 **官方 RSS / 官方 API** 或明確允許的資料介面
- 顯示「摘要/必要欄位」並導回原站
- 嚴格平台（OAuth/授權）在 MVP 不納入公開彙總榜單

### 技術風險
- 來源 API/RSS 格式變動 → Connector 可快速停用 + Raw 保留可回放
- 預算解析不準 → 保留 raw、版本化解析器、建立測試案例庫
- 匯率更新造成排名跳動 → v1 採「正規化當下快照」避免全站跳動

---

# 2. 系統架構書（SAD）

## 2.1 架構總覽
### 技術選型
- Web：Next.js（含 API routes 作為 BFF）
- Worker：Node.js + BullMQ（Redis）
- DB：PostgreSQL（主資料、交易一致性、分析查詢）
- Cache/Queue：Redis（快取、佇列）
- 可觀測性：結構化 log + metrics（可接 OpenTelemetry）

### 高層元件圖
```mermaid
flowchart LR
  A[Scheduler/Cron] --> B[Queue: ingest]
  B --> C[Connector Workers<br/>Yourator API / WWR RSS]
  C --> D[(Postgres: raw_items)]
  D --> E[Queue: normalize]
  E --> F[Normalizer/Enricher<br/>budget+fx+taxonomy+skills+snippet]
  F --> G[(Postgres: jobs + snapshots)]
  G --> H[Queue: score]
  H --> I[Scoring Worker v1]
  I --> J[(Postgres: job_scores)]
  J --> K[Next.js API/BFF]
  K --> L[Next.js Web UI]

  A --> M[Queue: fx_update]
  M --> N[FX Worker]
  N --> O[(Postgres: fx snapshots + rates)]
  O --> K

  I --> P[Queue: notify]
  P --> Q[Notifier Worker]
  Q --> R[(Postgres: notifications)]
````

---

## 2.2 元件與責任邊界（R&R）

| 元件                  | 責任                                 | 產出/儲存                      |
| ------------------- | ---------------------------------- | -------------------------- |
| Connector Workers   | 拉取來源資料（RSS/API）、限流、重試、熔斷           | raw_items                  |
| Normalizer/Enricher | 正規化、估工、匯率換算、類別/技能/摘要               | jobs、job_snapshots         |
| FX Worker           | 定期更新匯率快照（latest + as-of）           | fx_rate_snapshots、fx_rates |
| Scoring Worker      | 計算 v1 分數與可解釋原因                     | job_scores                 |
| Notifier Worker     | 依 alerts 推送、寫入通知紀錄防重               | notifications              |
| Next.js API/BFF     | 查詢/篩選/排序、Profile、Actions、Admin API | DB                         |
| Next.js Web         | UI 與互動流程                           | -                          |

---

## 2.3 資料流與工作流（Workflow）

### 2.3.1 Ingestion（抓取）

1. Cron 觸發 ingest（source=yourator/wwr）
2. Connector 拉取列表，轉 RawJob
3. RawJob Upsert → raw_items（unique: sourceId+sourceJobKey）
4. enqueue normalize(rawItemId)

### 2.3.2 Normalization（正規化）

1. 讀 raw_items.payload → RawJob
2. budget parse（min/max/type/currency）
3. 取 latest FX snapshot → 換算 budget_twd/ehr_twd，並寫 fxSnapshotId
4. taxonomy mapping → categoryNorm
5. skills extraction（tags+文本規則）
6. snippet 生成
7. Job upsert + snapshot（若變更）
8. enqueue score(jobId)

### 2.3.3 Scoring（評分 v1）

1. 讀 Job
2. 計算 P/Fit/Q/R/Comp
3. 產生 Score(0-100) + reasons
4. upsert job_scores（version=v1）
5. enqueue notify(jobId)（符合條件時或由 notifier 端篩選）

### 2.3.4 Notification（通知）

1. 讀 alerts（enabled）
2. 規則 match：minScore / keywords / category / minEhr / maxApplicants
3. 寫 notifications（unique 防重）
4. 呼叫 Email/LINE/Telegram（通道 v1 可先做 Email）

---

## 2.4 資料模型（概述）

* 核心實體：Source、RawItem、Job、JobSnapshot、JobScore、User、UserProfile、UserAction、Alert、Notification、FxRateSnapshot、FxRate
* 去重原則：

  * RawItem：`(sourceId, sourceJobKey)` unique
  * Job：`(sourceId, sourceJobKey)` unique
* 追溯原則：

  * JobSnapshot：每次正規化後資料變更記錄
  * FX Snapshot：匯率每次更新保留快照，Job 記錄 fxSnapshotId

> 完整 ERD 與 Prisma Schema 參見「附件 A」。

---

## 2.5 匯率（FX）設計（TWD 基準 + 多幣別）

### 設計目標

* 以 **TWD 作為 Base Currency** 用於統一評分與比較
* UI 可切換顯示幣別（USD/EUR/JPY…）
* 匯率更新可追溯（as-of），避免排名與數字不明跳動

### 設計策略（v1）

* Job 正規化時計算 `budgetMinTwd/budgetMaxTwd/ehrTwd`，並寫入 `fxSnapshotId`
* 匯率更新不強制重算全站分數（避免跳動）；必要時可做批次重算（v1.1+）

---

## 2.6 正規化與估工（固定價→有效時薪）

### 目標

將不同預算型態轉成可比指標：**有效時薪 EHR（TWD）**。

### 規則（v1）

* 時薪案：`ehr_twd = hourly_rate * fx_rate`
* 固定價案：

  1. `budget_mid_twd = mid(min,max)*fx_rate`
  2. `estimated_hours = estimate(categoryNorm, keywords)`
  3. `ehr_twd = budget_mid_twd / estimated_hours`

> 預算解析與估工規則表見「附件 D」。

---

## 2.7 評分引擎（Scoring v1，含已投稿人數）

### 核心理念

性價比 = 有效報酬 + 匹配度 + 品質 − 風險 − 競爭（已投稿人數）

### 分數構成（0..1）

* P：報酬分（EHR 分位數正規化）
* Fit：匹配分（技能命中 + 類別吻合）
* Q：品質分（需求清晰/交付物/雇主可信）
* R：風險分（範圍模糊/詐騙訊號/不合理時程）
* Comp：競爭懲罰（已投稿人數 log 壓縮）

### 競爭懲罰（已投稿人數）

* `a = applicant_count_mid`（range 取中位數）
* `a0 = 5`（舒適門檻，可由 profile 調整）
* `k = 12`（斜率上限）

`Comp = clamp01( log(1 + a/a0) / log(1 + k) )`

缺值策略（MVP）：

* 若 a 缺：WWR 預設 0.5、Yourator 預設 0.4（可調）

### 最終分數

`Raw = 0.45*P + 0.25*Fit + 0.15*Q - 0.10*R - 0.20*Comp`
`Score = round(100 * sigmoid(4*(Raw - 0.5)))`

### 可解釋輸出

* reasonsPositive：Top 3（例如 EHR 高、技能命中、競爭低）
* reasonsNegative：Top 2（例如 競爭高、需求模糊）

> 權重與理由模板見「附件 E」。

---

## 2.8 推薦與通知

### 推薦（Recommendations）

1. Eligibility filter（硬條件）：

   * 排斥類別、最低 EHR、語言、remoteOnly 等
2. Ranking：

   * 以 job_scores(v1) 排序，並可加新鮮度微調（v1 可不做）

### 通知（Alerts）

* Daily digest：每日固定時間（預設 09:00 Asia/Taipei）
* Realtime：案件新增或分數更新後觸發規則
* 防重：`(userId, alertId, jobId)` unique

---

## 2.9 API 規格（BFF / Next.js API Routes）

* `GET /api/jobs`：列表、篩選、排序、幣別顯示換算
* `GET /api/jobs/:id`：詳情 + score breakdown + reasons + 導回原站
* `GET /api/recommendations`：依 profile 推薦
* `POST /api/profile`：更新技能/底線/幣別/競爭偏好
* `POST /api/actions`：收藏/忽略/點擊導出/投遞回饋
* `GET /api/fx/latest`：最新匯率快照（UI 顯示換算用）
* Admin（RBAC）：

  * `GET /api/admin/sources`
  * `POST /api/admin/sources/:id/toggle`
  * `POST /api/admin/weights`

> Request/Response 範例與查詢參數見「附件 B」。

---

## 2.10 後台（Admin）與營運

### 功能（MVP）

* Sources：

  * enabled toggle、rpmLimit、cronSpec
  * 近 24h 成功率、錯誤類型統計（由 log/metrics 或 DB 聚合）
* Scoring：

  * v1 權重調整（需記錄變更）
* 黑名單/風險字典（v1.1 建議）

---

## 2.11 安全、權限、可觀測性、維運

### 安全

* RBAC：User/Admin（MVP 用 `User.role`）
* API Rate limit：以 IP/User 維度限制（避免濫用）
* Secrets 管理：DB/Redis/通知金鑰集中管理（env + secret store）

### 可觀測性

* 指標：

  * ingest 成功率、429/timeout 次數
  * queue backlog（延遲與積壓）
  * normalize/score 失敗率
  * API p95 latency
* 日誌：

  * 每個 runId 對應完整 pipeline（ingest→normalize→score）
* 告警：

  * 來源連續失敗 N 次自動停用並通知 Admin（v1.1）

---

## 2.12 測試策略與驗收

### 測試

* Unit tests：

  * budget parse（各幣別/格式）
  * fx convert（快照）
  * scoring（含 applicant 缺值/極端值）
* Integration tests：

  * Connector 拉取與 payload 驗證（用 fixture）
  * Raw→Job 正規化一致性
* Regression tests：

  * 來源格式變動時快速驗證

### MVP 驗收（摘要）

* Pipeline 可連續運行 24h 不中斷（來源正常情況）
* 列表查詢可排序 score/ehr/postedAt
* 分數可解釋，且競爭懲罰顯示正確
* 幣別顯示可切換（以 latest snapshot 換算）
* 通知不重複（unique constraint）

---

# 3. 路線圖與規劃表（WBS + Milestones）

## 3.1 里程碑（8 週建議）

| 里程碑           | 週次 | 交付物                            | 驗收    |
| ------------- | -: | ------------------------------ | ----- |
| M0 啟動         | W1 | Repo/CI、SAD/PRD 凍結、DB 初始化      | 可開發   |
| M1 Pipeline   | W2 | ingest/normalize 打通、raw/job 入庫 | 可持續抓取 |
| M2 FX+EHR     | W3 | fx snapshots、EHR 計算、UI 幣別切換    | 可比化   |
| M3 Scoring v1 | W4 | 分數、競爭懲罰、reasons                | 可解釋   |
| M4 Web MVP    | W5 | 列表/詳情/收藏/忽略                    | 可用    |
| M5 推薦+通知      | W6 | recommendations、daily digest   | 不重複   |
| M6 Admin+監控   | W7 | sources 管理、權重調整、基本指標           | 可維運   |
| M7 Beta 上線    | W8 | UAT、上線、回饋 backlog              | 可迭代   |

## 3.2 WBS（MVP）

| 模組              | 子項                                  | Priority | 產出         |
| --------------- | ----------------------------------- | -------: | ---------- |
| 基礎建設            | monorepo、env、docker compose         |       P0 | 可跑環境       |
| DB              | prisma schema + migration + index   |       P0 | 資料層        |
| Queue/Worker    | BullMQ queues + workers             |       P0 | pipeline   |
| Connector       | Yourator API、WWR RSS                |       P0 | raw_items  |
| Normalize       | budget+fx+taxonomy+skills+snippet   |       P0 | jobs       |
| Scoring         | v1 + reasons                        |       P0 | job_scores |
| Web             | jobs list/detail, filters, currency |       P0 | UI         |
| Profile/Actions | profile、save/hide/click             |       P0 | user loop  |
| Notifications   | daily + realtime（簡化）                |       P1 | alerts     |
| Admin           | sources + weights                   |       P1 | ops        |

---

# 4. 附件（完整可開工）

---

## 附件 A：ERD（文字版）+ Prisma Schema（含索引）

### A1. ERD（文字版）

sources（來源平台） 1 ── * raw_items（原始資料）
sources 1 ── * jobs（標準化案件） 1 ── * job_snapshots（案件快照）
jobs 1 ── * job_scores（分數版本）
users 1 ── 1 user_profiles
users 1 ── * user_actions (* ── 1 jobs)
users 1 ── * alerts（通知規則） 1 ── * notifications（通知紀錄）
fx_rate_snapshots 1 ── * fx_rates
jobs * ── 1 fx_rate_snapshots（jobs.fxSnapshotId：正規化時計算使用的快照）

注意：Yourator / WWR 來源資料各自進 raw_items，Normalizer 統一寫入 jobs。

### A2. Prisma Schema

> 檔名建議：prisma/schema.prisma
> 說明：我用 @@index/@@unique 把你 MVP 必要的查詢與去重都涵蓋。你可依部署環境調整 provider。

> 建議 repo 內固定位置：
prisma/schema.prisma
docs/SAD_PRD.md（本文件）
docs/attachments/*

ˋˋˋprisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SourceTier {
  A
  B
  C
}

enum BudgetType {
  HOURLY
  FIXED
  UNKNOWN
}

enum JobStatus {
  ACTIVE
  EXPIRED
  REMOVED
}

enum ActionType {
  VIEW
  SAVE
  HIDE
  CLICK_OUT
  APPLIED
  WON
  LOST
}

enum AlertChannel {
  EMAIL
  LINE
  TELEGRAM
}

model Source {
  id          String    @id @default(uuid())
  key         String    @unique  // "yourator" | "wwr"
  name        String
  tier        SourceTier @default(A)
  enabled     Boolean   @default(true)

  // rate limiting / scheduling
  rpmLimit    Int       @default(60)  // requests per minute
  cronSpec    String?   // e.g. "*/10 * * * *"
  config      Json?     // connector config (base url, api params, rss categories)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  rawItems    RawItem[]
  jobs        Job[]
}

model RawItem {
  id          String   @id @default(uuid())
  sourceId    String
  source      Source   @relation(fields: [sourceId], references: [id])

  sourceJobKey String  // upstream job id or stable key
  url          String
  fetchedAt    DateTime @default(now())

  payload      Json     // raw response
  payloadHash  String   // for dedup / change detect
  parsedOk     Boolean  @default(false)
  error        String?

  createdAt    DateTime @default(now())

  @@unique([sourceId, sourceJobKey])
  @@index([sourceId, fetchedAt])
  @@index([payloadHash])
}

model FxRateSnapshot {
  id           String   @id @default(uuid())
  baseCurrency String   @default("TWD")
  provider     String   // e.g. "ecb" / "openexchangerates"
  asOf         DateTime
  fetchedAt    DateTime @default(now())
  isLatest     Boolean  @default(false)
  checksum     String   @unique
  meta         Json?

  rates        FxRate[]
  jobs         Job[]

  @@index([isLatest])
  @@index([asOf])
}

model FxRate {
  snapshotId    String
  snapshot      FxRateSnapshot @relation(fields: [snapshotId], references: [id])

  quoteCurrency String // USD/EUR/JPY...
  rate          Decimal @db.Numeric(18, 6) // TWD per 1 quote

  @@id([snapshotId, quoteCurrency])
}

model Job {
  id             String   @id @default(uuid())
  sourceId       String
  source         Source   @relation(fields: [sourceId], references: [id])

  sourceJobKey   String
  canonicalUrl   String
  title          String
  snippet        String?   // generated summary
  descriptionHash String?  // for change detect (avoid storing full text if you prefer)
  categoryRaw    String?
  categoryNorm   String?
  skills         String[]  // MVP: array; v2 can normalize to join table

  budgetType     BudgetType @default(UNKNOWN)
  currency       String?    // original
  budgetMin      Decimal?   @db.Numeric(18, 2)
  budgetMax      Decimal?   @db.Numeric(18, 2)

  // normalized in TWD
  budgetMinTwd   Decimal?   @db.Numeric(18, 2)
  budgetMaxTwd   Decimal?   @db.Numeric(18, 2)
  ehrTwd         Decimal?   @db.Numeric(18, 2) // effective hourly rate in TWD

  fxSnapshotId   String?
  fxSnapshot     FxRateSnapshot? @relation(fields: [fxSnapshotId], references: [id])

  remoteFlag     Boolean?   // remote or not (if known)
  locationText   String?
  language       String?
  timezone       String?

  applicantCountMin Int?
  applicantCountMax Int?

  clientTrust    Decimal?   @db.Numeric(4, 3) // 0..1

  postedAt       DateTime?
  updatedAtUpstream DateTime?
  normalizedAt   DateTime?  // when normalization applied
  lastSeenAt     DateTime   @default(now())
  status         JobStatus  @default(ACTIVE)

  snapshots      JobSnapshot[]
  scores         JobScore[]
  actions        UserAction[]

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@unique([sourceId, sourceJobKey])
  @@index([status, lastSeenAt])
  @@index([postedAt])
  @@index([categoryNorm])
  @@index([skills])
  @@index([ehrTwd])
}

model JobSnapshot {
  id            String   @id @default(uuid())
  jobId         String
  job           Job      @relation(fields: [jobId], references: [id])

  snapshotAt    DateTime @default(now())
  fields        Json     // store changed fields summary (diff or full normalized payload)
  changeHash    String

  @@index([jobId, snapshotAt])
  @@index([changeHash])
}

model JobScore {
  id            String   @id @default(uuid())
  jobId         String
  job           Job      @relation(fields: [jobId], references: [id])

  version       String   // "v1"
  score         Int      // 0..100

  // breakdown 0..1 for explainability
  pReward       Decimal? @db.Numeric(5, 4)
  pFit          Decimal? @db.Numeric(5, 4)
  pQuality      Decimal? @db.Numeric(5, 4)
  pRisk         Decimal? @db.Numeric(5, 4)
  pCompetition  Decimal? @db.Numeric(5, 4)

  reasonsPositive String[] // top positive reasons
  reasonsNegative String[] // top negative reasons
  meta          Json?      // weights, intermediate numbers (EHR, applicants mid, etc.)

  computedAt    DateTime @default(now())

  @@index([version, score])
  @@index([jobId, version])
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String?
  role         String   @default("USER") // USER/ADMIN (MVP simple)

  profile      UserProfile?
  actions      UserAction[]
  alerts       Alert[]
  notifications Notification[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model UserProfile{
  userId       String  @id
  user         User    @relation(fields: [userId], references: [id])

  // preferences
  skills       String[] // user skills
  categoriesAllow String[]
  categoriesBlock String[]
  minEhrTwd    Decimal? @db.Numeric(18, 2) // floor
  languages    String[]
  remoteOnly   Boolean? @default(true)

  // scoring knobs
  preferLowCompetition Boolean @default(true)
  competitionA0 Int @default(5)

  displayCurrency String @default("TWD") // UI display currency

  updatedAt    DateTime @updatedAt
}

model UserAction {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  jobId       String
  job         Job      @relation(fields: [jobId], references: [id])

  type        ActionType
  note        String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([jobId, type])
  @@unique([userId, jobId, type]) // prevent duplicates per action type
}

model Alert {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  name        String
  enabled     Boolean  @default(true)
  channel     AlertChannel @default(EMAIL)

  // rule definition
  minScore    Int?     // e.g. 70
  keywords    String[] // AND/OR can be v2; MVP treat as OR
  categories  String[]
  maxApplicants Int?   // competition guard
  minEhrTwd   Decimal? @db.Numeric(18, 2)

  // schedule
  dailyTime   String?  // "09:00" for daily digest, null = realtime
  timezone    String   @default("Asia/Taipei")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  notifications Notification[]

  @@index([userId, enabled])
}

model Notification {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  alertId     String?
  alert       Alert?   @relation(fields: [alertId], references: [id])

  jobId       String
  job         Job      @relation(fields: [jobId], references: [id])

  channel     AlertChannel
  sentAt      DateTime @default(now())
  payload     Json?

  @@unique([userId, alertId, jobId]) // prevent duplicates per rule
  @@index([userId, sentAt])
}

ˋˋˋ

###A3. Index／查詢建議（MVP 必要）
列表排序（score/ehr/postedAt）：

Job(ehrTwd), Job(postedAt)

JobScore(version, score)

去重鍵：

RawItem(sourceId, sourceJobKey) unique

Job(sourceId, sourceJobKey) unique

篩選：

Job(status, lastSeenAt), Job(categoryNorm), Job(skills)（array index 視情況；MVP 可先不加 GIN，後續再加）

建議加強（Postgres 原生 SQL migration 追加）：

GIN index on skills（若你 skills filter 很常用）

Full-text search（title/snippet）可在 v1.1 做

---

## 附件 B：介面規格（Connector 契約 / Queue Payload / API）

### B1. Connector 契約（RawJob）

```ts
export type BudgetType = "HOURLY" | "FIXED" | "UNKNOWN";

export interface RawJob {
  sourceKey: "yourator" | "wwr";
  sourceJobKey: string;
  url: string;
  fetchedAt: string;

  title?: string;
  description?: string;

  budgetType?: BudgetType;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;

  tags?: string[];
  categoryRaw?: string;

  remoteFlag?: boolean;
  locationText?: string;

  applicantCountMin?: number;
  applicantCountMax?: number;

  postedAt?: string;
  updatedAt?: string;

  client?: {
    rating?: number;
    paymentVerified?: boolean;
    hireCount?: number;
  };

  rawPayload?: unknown;
}
```

### B2. Queue Payload（BullMQ）

#### ingest

```json
{
  "sourceKey": "yourator",
  "runId": "uuid",
  "params": { "pageFrom": 1, "pageTo": 3, "term": "接案" }
}
```

#### normalize

```json
{ "rawItemId": "uuid", "runId": "uuid" }
```

#### score

```json
{ "jobId": "uuid", "version": "v1", "runId": "uuid" }
```

#### fx_update

```json
{ "provider": "ecb", "runId": "uuid" }
```

#### notify

```json
{ "jobId": "uuid", "mode": "realtime", "runId": "uuid" }
```

### B3. API（摘要）

#### GET /api/jobs（Query）

* `q, category, skills, minScore, minEhrTwd, maxApplicants`
* `sort=score|ehr|postedAt`, `order=desc|asc`
* `page, pageSize`
* `displayCurrency`（預設 userProfile.displayCurrency 或 TWD）

#### GET /api/jobs/:id

* 回傳 breakdown（P/Fit/Q/R/Comp）、reasons、導回原站 link

#### GET /api/fx/latest

* 回傳 latest snapshot（asOf + rates）

#### POST /api/profile

* skills、minEhrTwd、displayCurrency、competitionA0、categoriesAllow/Block

#### POST /api/actions

* `{ jobId, type: SAVE|HIDE|CLICK_OUT|APPLIED, note? }`

---

## 附件 C：Taxonomy v1（類別統一）與 Skill 字典 v1

### C1. Taxonomy v1（範例）

* Web/Frontend：React、Next.js、Vue、Angular、Tailwind
* Web/Backend：Node.js、NestJS、Express、Python、Django、FastAPI
* Web/Fullstack：Next.js、DB、API、Auth
* Data/Scraping：爬蟲、ETL、API整合、資料清洗
* AI/LLM：RAG、向量資料庫、Prompt、LangChain
* Design/UIUX：Figma、Design System、User Research
* Media/Video：剪輯、調色、字幕、音訊同步

### C2. Skill 字典 v1（關鍵字→標準技能）

* "nextjs", "next.js" → "Next.js"
* "react" → "React"
* "tailwind" → "Tailwind"
* "node", "nodejs" → "Node.js"
* "fastapi" → "FastAPI"
* "scraping", "crawler", "爬蟲" → "爬蟲"
* "rag", "vector db" → "RAG/向量資料庫"
* "davinci", "resolve" → "DaVinci Resolve"

> v1 用字典+規則即可；v2 再上 embedding。

---

## 附件 D：預算解析（Budget Parse）與估工規則 v1

### D1. Budget Parse v1（策略）

* 支援：

  * `FIXED`：固定價（單值或範圍）
  * `HOURLY`：時薪（單值或範圍）
  * `UNKNOWN`：缺值
* 幣別：

  * 若來源提供 currency → 使用
  * 若缺 → 推斷（WWR 多為 USD；Yourator 多為 TWD；不確定則 UNKNOWN）

### D2. 估工規則表（示例，可在 config 調整）

| categoryNorm  | baseHours |
| ------------- | --------: |
| Web/Frontend  |        16 |
| Web/Backend   |        24 |
| Web/Fullstack |        40 |
| Data/Scraping |        24 |
| AI/LLM        |        60 |
| Design/UIUX   |        24 |
| Media/Video   |        16 |

關鍵字加成（示例）：

* "login/auth" +8
* "payment" +12
* "deployment" +6
* "multi-language" +8
* "urgent/急件" +4（同時提高風險 R）

---

## 附件 E：Scoring v1 設定（權重、缺值策略、理由模板）

### E1. 權重（v1 default）

```json
{
  "version": "v1",
  "weights": { "P": 0.45, "Fit": 0.25, "Q": 0.15, "R": 0.10, "Comp": 0.20 },
  "sigmoidTemp": 4,
  "rawMidpoint": 0.5
}
```

### E2. 競爭缺值（Comp default）

```json
{
  "competitionDefaults": { "wwr": 0.5, "yourator": 0.4 },
  "a0Default": 5,
  "k": 12
}
```

### E3. 理由模板（示例）

* Positive：

  * "有效時薪高於同類別 p75"
  * "技能命中：{hit}/{req}"
  * "競爭低：已投稿 {a}"
* Negative：

  * "競爭高：已投稿 {a}"
  * "需求不清：缺少交付物/驗收"
  * "風險字詞：{keywords}"

---

## 附件 F：部署與環境變數（Docker/Env）

### F1. 建議目錄

* `apps/web`：Next.js
* `apps/worker`：workers
* `packages/core`：connectors/normalize/scoring/fx
* `prisma/`

### F2. 主要環境變數

* `DATABASE_URL=postgresql://...`
* `REDIS_URL=redis://...`
* `FX_PROVIDER=ecb`
* `DEFAULT_BASE_CURRENCY=TWD`
* `DEFAULT_TIMEZONE=Asia/Taipei`
* `NOTIFY_EMAIL_SMTP_URL=...`（若走 Email）
* `ADMIN_SEED_EMAIL=...`

### F3. Docker Compose（摘要）

* postgres
* redis
* web
* worker

---

## 附件 G：Runbook（維運手冊）

### G1. 常見故障

1. 來源抓取失敗（HTTP 429/timeout）

* 降低 rpmLimit、延長退避、暫停來源 enabled=false

2. Queue 積壓

* 查 redis 連線、worker concurrency、DB 慢查詢

3. 分數異常跳動

* 檢查 fx snapshot 是否被誤用（應使用 job.fxSnapshotId 進行計分）

### G2. 手動操作

* 重新 normalize 某 rawItemId
* 重新 score 某 jobId
* 重新跑 fx_update
* 停用來源（避免整體 pipeline 被拖垮）

---

## 附件 H：驗收清單（DoD / UAT）

### H1. DoD（工程完成定義）

* 具備單元測試（budget/fx/scoring）
* 具備基本監控指標（成功率、queue backlog）
* 具備防重（DB unique constraint + app logic）
* 可在 staging 環境跑滿 24h

### H2. UAT Checklist（使用者驗收）

* 可切換顯示幣別且換算正確
* 案件排序（score/ehr/postedAt）符合預期
* 競爭懲罰顯示正確（含缺值時合理）
* 收藏/忽略後列表行為正確
* 每日通知不重複、內容符合規則

---

# 結語：MVP 開工指引（最短路徑）

1. 建 DB（Prisma migrate）＋ Redis
2. 做 Connector（Yourator/WWR）→ raw_items
3. 做 Normalizer（budget+fx+taxonomy+skills+snippet）→ jobs + snapshots
4. 做 Scoring v1（含 competition）→ job_scores
5. 做 Web（list/detail + profile + currency）
6. 做 Daily digest 通知（alert + notification + 防重）

以上文件與附件已涵蓋開工必需資訊（資料模型、介面契約、工作流、評分公式、估工規則、部署與驗收）。

```
::contentReference[oaicite:0]{index=0}
```
