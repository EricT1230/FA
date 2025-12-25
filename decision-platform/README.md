# 外包決策風險管控平台 (Decision Platform)
## 🎯 專案概要

這是一個從「幫接案者比較案子」升級為「幫組織承擔外包決策風險」的平台。根據投資人級別的商業規格設計，專注於**風險攔截**而非效率提升，是團隊外包決策的基礎設施。

> **目標客戶**：3-10人、專案收入型、無專職PM的工作室  
> **核心價值**：「幫你避免最容易後悔的案子」

---

## 🚀 快速開始

### 啟動開發環境
```bash
npm install
npm run dev
```
開啟 [http://localhost:3001](http://localhost:3001) 查看應用程式

### 已實現功能

#### ✅ Risk Gate（風險門）
- 自動識別高風險案件並攔截
- 三級風險等級評估系統
- 可解釋的風險分析報告

#### ✅ Decision Record（決策記錄）
- 完整的決策過程記錄
- 團隊成員信號收集
- 決策責任追蹤系統

#### ✅ 現代化 UI
- shadcn/ui 組件庫
- 響應式設計
- 專業視覺風格

---

## 📋 使用流程

1. **瀏覽案件** - 在 Risk Gate 評估頁面查看自動風險評估
2. **選擇案件** - 點選案件查看詳細風險分析
3. **做出決策** - 基於風險評估選擇「接案」或「跳過」
4. **記錄決策** - 系統自動生成決策記錄與團隊評估
5. **追蹤結果** - 在決策記錄頁面查看歷史決策

---

## 🏗️ 技術架構

- **框架**: Next.js 14+ (App Router)
- **樣式**: TailwindCSS + shadcn/ui
- **語言**: TypeScript
- **狀態管理**: React Server Components + Client Components
- **圖示**: Lucide React

---

## 💡 關鍵創新

1. **Risk Gate 概念**: 主動攔截風險，而非被動推薦
2. **Explainability 優先**: 每個決策都有清楚解釋
3. **Decision Record 系統**: 完整的決策歷史與責任追蹤
4. **團隊協作導向**: 為多人決策場景設計

**這不是效率工具，這是風險管控基礎設施。**

---

## 📚 相關文件

- [系統架構](./ARCHITECTURE.md)
- [商業規格](../PITCH_DECK_INVESTOR.md)
- [團隊功能](../TEAM_STUDIO_MODE_MVP.md)
- [完整規格](../Freelancer_Aggregator.md)

---

*🤖 Generated with [Claude Code](https://claude.ai/code)*  
*Co-Authored-By: Claude <noreply@anthropic.com>*
