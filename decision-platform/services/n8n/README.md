# n8n 工作流自動化

## 🔄 概述

n8n 取代了原本的 Worker 和 Scheduler 服務，提供可視化的工作流編輯和強大的自動化能力。

## 🏗️ 架構整合

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   app       │    │    auth     │    │    n8n      │
│ (Next.js)   │    │ (Express)   │    │ (Workflow)  │
│             │    │             │    │             │
│ • UI/BFF    │    │ • SSO       │    │ • 數據管道   │
│ • APIs      │    │ • JWT       │    │ • 評分算法   │
│ • Actions   │    │ • OAuth     │    │ • 風險評估   │
│             │    │             │    │ • 通知發送   │
└─────────────┘    └─────────────┘    └─────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                          │
        ┌─────────────────────────────────────┐
        │           Infrastructure            │
        │ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
        │ │PostgreSQL│ │  Redis  │ │ MinIO   │ │
        │ └─────────┘ └─────────┘ └─────────┘ │
        └─────────────────────────────────────┘
```

## 🎛️ n8n 控制台

### 訪問方式
- **URL**: http://localhost:5678
- **用戶名**: admin
- **密碼**: admin123

### 快速開始
```bash
# 啟動所有服務 (包含 n8n)
npm run docker:up

# 打開 n8n 控制台
npm run n8n:open

# 檢查 n8n 健康狀態
npm run n8n:health

# 查看已安裝的工作流
npm run n8n:workflows
```

## 📋 預設工作流

### 1. **Yourator 數據爬取** (`yourator-ingestion`)
- **觸發**: 每 5 分鐘
- **功能**: 
  - 爬取 Yourator 最新職缺
  - 數據正規化處理
  - 存入 `raw_jobs` 表
  - 觸發評分管道

### 2. **工作評分管道** (`job-scoring-pipeline`)
- **觸發**: Webhook `/webhook/score-job`
- **功能**:
  - 計算 P/Fit/Q/R/Comp 分數
  - 生成推薦理由
  - 存入 `jobs` 表
  - 觸發風險評估

### 3. **風險評估** (`risk-assessment`)
- **觸發**: Webhook `/webhook/risk-assessment`
- **功能**:
  - 多維度風險因子分析
  - 生成風險等級 (PASS/SOFT_WARNING/HARD_BLOCK)
  - 提供具體建議
  - 觸發高分警報

### 4. **每日摘要** (`daily-digest`)
- **觸發**: 每日 9:00 AM
- **功能**:
  - 收集過去 24 小時高分工作
  - 根據團隊偏好篩選
  - 發送 HTML 格式摘要郵件
  - 團隊個性化推薦

## 🔗 API 整合

### 觸發工作流
```bash
# 手動觸發評分
curl -X POST \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "score-job",
    "data": {
      "jobId": "550e8400-e29b-41d4-a716-446655440031"
    }
  }' \
  http://localhost:3000/api/n8n/trigger

# 觸發團隊通知
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "team-notification",
    "data": {
      "teamId": "550e8400-e29b-41d4-a716-446655440010",
      "type": "decision-made",
      "title": "新的團隊決策",
      "message": "案件已通過團隊評估"
    }
  }' \
  http://localhost:3000/api/n8n/trigger
```

### 直接調用 n8n Webhooks
```bash
# 評分工作流
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jobId": "job-123"}' \
  http://localhost:5678/webhook/score-job

# 風險評估
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jobId": "job-123", "score": 85}' \
  http://localhost:5678/webhook/risk-assessment
```

## 🛠️ 自定義工作流

### 創建新工作流
1. 打開 n8n 控制台 (http://localhost:5678)
2. 點擊 "New workflow"
3. 拖拽節點建立流程
4. 配置觸發器和連接
5. 測試並啟用工作流

### 常用節點
- **Webhook**: 接收 HTTP 請求觸發
- **Cron**: 定時執行
- **Postgres**: 資料庫操作
- **HTTP Request**: 調用外部 API
- **Code**: 自定義 JavaScript 邏輯
- **Email**: 發送郵件通知
- **IF**: 條件分支
- **Set**: 數據轉換

### 工作流模板
```json
{
  "name": "Custom Workflow",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "custom-webhook"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "// Your custom logic here\nreturn [{ json: $json }];"
      },
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "position": [460, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Process Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 📊 監控與除錯

### n8n 控制台功能
- **Executions**: 查看工作流執行歷史
- **Logs**: 即時日誌監控
- **Settings**: 全域設定
- **Credentials**: 安全憑證管理

### 除錯技巧
1. **使用 Manual trigger** 測試工作流
2. **檢查 Execution log** 找出錯誤
3. **使用 Code node** 打印除錯資訊
4. **設定適當的 Error handling**

### 監控指令
```bash
# 檢查 n8n 服務狀態
docker-compose logs n8n

# 查看活動工作流
npm run n8n:workflows

# 檢查 PostgreSQL n8n schema
docker-compose exec db psql -U fa_user -d freelancer_aggregator -c "\\dt n8n.*"
```

## 🚀 生產環境配置

### 安全設定
```bash
# 強密碼
N8N_BASIC_AUTH_PASSWORD=your-strong-password

# 加密金鑰
N8N_ENCRYPTION_KEY=your-32-character-encryption-key

# 禁用不需要的節點
N8N_NODES_EXCLUDE=n8n-nodes-base.httpRequest
```

### 效能優化
```bash
# 執行模式
EXECUTIONS_MODE=queue
EXECUTIONS_TIMEOUT=3600

# 資料清理
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336  # 14 days
```

### 備份工作流
```bash
# 匯出所有工作流
curl -u admin:admin123 \
  http://localhost:5678/api/v1/workflows \
  > workflows-backup.json

# 匯入工作流
curl -u admin:admin123 \
  -X POST \
  -H "Content-Type: application/json" \
  -d @workflow.json \
  http://localhost:5678/api/v1/workflows
```

## ⚡ 優勢

### vs 傳統 Worker Service
- ✅ **可視化編輯**: 拖拽式工作流設計
- ✅ **無程式碼**: 非開發人員也能建立自動化
- ✅ **即時監控**: 內建執行歷史和日誌
- ✅ **豐富整合**: 600+ 預建節點
- ✅ **錯誤處理**: 內建重試和錯誤分支
- ✅ **版本控制**: 工作流版本管理

### vs 傳統 Scheduler
- ✅ **彈性排程**: 複雜的時間規則
- ✅ **條件執行**: 基於數據的智能觸發
- ✅ **依賴管理**: 工作流之間的依賴關係
- ✅ **失敗處理**: 自動重試和告警機制

---

**🎯 結果**: 將複雜的後端邏輯轉換為可視化、可維護的工作流，大幅提升開發和維護效率！