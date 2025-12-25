# 🚀 CI/CD 開發環境完整指南

## 📋 概述

這是一個完整的 CI/CD 開發環境，包含自動化測試、部署、監控和安全掃描。

## 🏗️ 架構總覽

```
┌─────────────────────────────────────────────────────────────┐
│                   CI/CD Pipeline                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Development   │     Staging     │      Production         │
│                 │                 │                         │
│ • Local Testing │ • Auto Deploy  │ • Manual Approval       │
│ • Code Quality  │ • Integration   │ • Zero Downtime         │
│ • Security Scan │   Tests         │ • Health Monitoring     │
│ • Unit Tests    │ • Performance   │ • Backup & Recovery     │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 🚀 快速開始

### 1. 開發環境設置
```bash
# 克隆項目
git clone https://github.com/EricT1230/FA.git
cd FA

# 安裝依賴
pnpm install

# 設置開發環境
pnpm setup:dev

# 啟動開發服務
pnpm dev
```

### 2. 運行測試
```bash
# 運行所有測試
pnpm test:all

# 運行單一服務測試
pnpm test              # 主應用
pnpm test:auth         # 認證服務

# 監控模式測試
cd decision-platform && pnpm test:watch
```

### 3. 代碼質量檢查
```bash
# ESLint 檢查
pnpm lint

# TypeScript 類型檢查
pnpm type-check

# 安全漏洞掃描
pnpm security:audit:all

# 完整 CI 檢查
pnpm ci:test
```

## 🔄 CI/CD 工作流

### 📝 開發工作流
1. **功能開發**
   ```bash
   git checkout -b feature/new-feature
   # 開發功能...
   pnpm ci:test  # 本地測試
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **自動化檢查** (GitHub Actions)
   - ✅ 代碼品質檢查 (ESLint, TypeScript)
   - ✅ 安全漏洞掃描 (Trivy, Snyk)
   - ✅ 單元測試 + 覆蓋率
   - ✅ Docker 構建測試

3. **Pull Request**
   - 自動運行完整測試套件
   - 代碼審查
   - 合併到 main 分支

### 🎭 Staging 部署
```bash
# 自動觸發 (推送到 main 分支)
git push origin main

# 手動部署
pnpm deploy:staging

# 或使用腳本
./decision-platform/scripts/deployment/deploy.sh staging
```

**Staging 環境**:
- 🌐 URL: https://staging.fa.example.com
- 🔗 N8N: http://localhost:15679
- 📊 監控: http://localhost:3002 (Grafana)

### 🏭 Production 部署
```bash
# 標籤發布
git tag v1.0.0
git push origin v1.0.0

# 手動批准後自動部署到生產環境
```

**Production 環境**:
- 🌐 URL: https://fa.example.com
- 📊 監控: https://fa.example.com/grafana
- 🔍 日誌: https://fa.example.com/logs

## 🐳 Docker 環境管理

### 開發環境
```bash
# 啟動最小服務 (DB + Redis + MinIO + N8N)
pnpm docker:dev

# 檢查服務狀態
docker-compose -f decision-platform/docker-compose.minimal.yml ps

# 查看日誌
pnpm logs:all
```

### Staging 環境
```bash
# 部署到 Staging
pnpm docker:staging

# 健康檢查
pnpm health:check

# 查看特定服務日誌
pnpm logs:app
pnpm logs:n8n
```

### Production 環境
```bash
# 部署到 Production (需要環境變數)
export IMAGE_TAG=v1.0.0
pnpm docker:prod

# 監控服務
docker-compose -f decision-platform/docker-compose.production.yml ps
```

## 🧪 測試策略

### 測試層級
1. **單元測試** - Jest + Testing Library
   - React 組件測試
   - 工具函數測試
   - API 路由測試

2. **集成測試** - Jest + 真實數據庫
   - 資料庫操作測試
   - Redis 快取測試
   - N8N 工作流測試

3. **端到端測試** - Playwright (未來)
   - 用戶流程測試
   - 瀏覽器兼容性

### 測試命令
```bash
# 開發中測試
pnpm test:watch

# CI 測試
pnpm test:ci

# 覆蓋率報告
pnpm test:coverage

# 特定文件測試
cd decision-platform && pnpm test src/components/Button.test.tsx
```

## 🔒 安全與品質

### 自動化安全檢查
- **依賴漏洞掃描**: `pnpm audit`
- **容器安全**: Trivy scanner
- **代碼安全**: Snyk analysis
- **SAST**: GitHub CodeQL

### 代碼品質
- **ESLint**: 代碼風格和最佳實踐
- **TypeScript**: 類型安全
- **Prettier**: 代碼格式化
- **Pre-commit hooks**: 自動檢查

### 配置文件
- `.eslintrc.json` - ESLint 規則
- `jest.config.js` - 測試配置
- `.husky/pre-commit` - Git hooks

## 📊 監控與觀察

### 監控堆疊
- **Prometheus**: 指標收集
- **Grafana**: 視覺化儀表板
- **Loki**: 日誌聚合
- **AlertManager**: 告警管理

### 關鍵指標
1. **應用指標**
   - 請求響應時間
   - 錯誤率
   - 吞吐量
   - 用戶活躍度

2. **基礎設施指標**
   - CPU / 記憶體使用率
   - 磁碟空間
   - 網路延遲
   - 容器狀態

3. **業務指標**
   - 案件處理數量
   - 用戶決策率
   - N8N 工作流執行
   - 系統錯誤追蹤

### 訪問監控
```bash
# Grafana 儀表板
open http://localhost:3002
# 用戶名: admin, 密碼: 見 .env.production

# Prometheus 查詢
open http://localhost:9090

# 容器日誌
pnpm logs:app     # 應用日誌  
pnpm logs:n8n     # N8N 日誌
pnpm logs:all     # 所有服務日誌
```

## 🚀 部署流程

### Staging 自動部署
1. 推送到 `main` 分支
2. GitHub Actions 自動觸發
3. 運行完整測試套件
4. 構建 Docker 映像
5. 部署到 Staging
6. 健康檢查
7. Slack/Discord 通知

### Production 部署
1. 創建發布標籤: `git tag v1.0.0`
2. 推送標籤: `git push origin v1.0.0`
3. GitHub Actions 觸發
4. 需要手動批准
5. 零停機部署
6. 自動備份
7. 健康檢查
8. 生產監控告警

### 緊急回滾
```bash
# 使用部署腳本回滾
./decision-platform/scripts/deployment/deploy.sh --rollback

# 或手動回滾到特定版本
export IMAGE_TAG=v1.0.0-previous
pnpm docker:prod
```

## 🔧 環境配置

### 環境變數檔案
- `.env.example` - 範例配置
- `.env.staging` - Staging 環境
- `.env.production` - Production 環境

### 必需的 Secrets (GitHub)
```bash
# 資料庫
SECRET_DB_PASSWORD
SECRET_DB_REPLICATION_PASSWORD

# 認證
SECRET_JWT_SECRET
SECRET_SESSION_SECRET
SECRET_NEXTAUTH_SECRET

# OAuth
SECRET_GOOGLE_CLIENT_ID
SECRET_GOOGLE_CLIENT_SECRET
SECRET_GITHUB_CLIENT_ID
SECRET_GITHUB_CLIENT_SECRET

# 儲存
SECRET_MINIO_ROOT_USER
SECRET_MINIO_ROOT_PASSWORD

# N8N
SECRET_N8N_USER
SECRET_N8N_PASSWORD
SECRET_N8N_ENCRYPTION_KEY

# 監控
SECRET_GRAFANA_PASSWORD
SECRET_SENTRY_DSN

# 通知
SLACK_WEBHOOK_URL
DISCORD_WEBHOOK_URL
```

## 🛠️ 開發工具

### 推薦的 VS Code 擴展
- ESLint
- Prettier
- TypeScript Importer
- Jest Runner
- Docker
- GitLens

### 有用的命令
```bash
# 清理環境
pnpm clean

# 重置開發環境
pnpm docker:down && pnpm docker:dev

# 查看容器狀態
docker-compose ps

# 資料庫備份
pnpm backup:db

# 查看資源使用
docker stats
```

## 🚨 故障排除

### 常見問題

#### 測試失敗
```bash
# 檢查測試配置
cd decision-platform && pnpm test --verbose

# 清除測試快取
cd decision-platform && npx jest --clearCache
```

#### Docker 構建問題
```bash
# 清理 Docker 資源
pnpm docker:clean

# 重新構建映像
docker-compose build --no-cache
```

#### 部署失敗
```bash
# 檢查服務日誌
pnpm logs:all

# 驗證環境變數
docker-compose config

# 健康檢查
pnpm health:check
```

## 📚 相關文檔

- 📖 [架構文檔](./README.md)
- 🔄 [N8N 工作流](./decision-platform/README-N8N.md)
- 🐳 [Docker 部署](./decision-platform/README-MICROSERVICES.md)
- 🔒 [安全指南](./SECURITY.md)

## 🤝 貢獻指南

1. Fork 項目
2. 創建功能分支: `git checkout -b feature/amazing-feature`
3. 提交變更: `git commit -m 'feat: add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`  
5. 創建 Pull Request

---

**🎉 現在您擁有一個企業級的 CI/CD 開發環境！**