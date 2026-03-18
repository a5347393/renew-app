# 老宅延壽機能復新計畫 — 修繕補助勾選單
## Claude Code 接手說明文件

---

## 專案基本資訊

| 項目 | 內容 |
|---|---|
| GitHub Repo | `a5347393/renew-app` |
| 線上網址 | https://a5347393.github.io/renew-app/ |
| 技術棧 | React 18 + Vite 5 |
| 部署方式 | GitHub Actions → GitHub Pages（push main 自動觸發） |
| 主要檔案 | `src/App.jsx`（單檔，所有邏輯在此） |

---

## 已完成功能

### 資料結構
- `ITEMS` — 三個群組：前置評估、室外修繕、室內修繕
- `SUBITEMS` — 每個主項目的細項清單
- `NOTE_PLACEHOLDERS` — 每個項目的備註範例文字

### UI 功能
- 頂部深綠色 header，含專案名稱、匯出按鈕、勾選進度條
- 基本資料填寫（業主姓名、地址、設計師、日期、整體備註）
- 藍色規則提示框
- 分區段顯示（前置評估 / 室外修繕 / 室內修繕），含「X 選」計數 badge
- 室內修繕區塊：未完成室外時鎖定（半透明 + 提示文字）
- 每個主項目點擊整行勾選，勾選後卡片變色 + 陰影
- 自訂 SVG checkbox（非原生樣式）
- 補助金額以橘色 pill badge 顯示
- 立面修繕：勾選後出現樓層選擇器（1-2層/3-4層/5-6層），影響補助上限
- 居家安全項目：加碼條件 checkbox（20萬 → 30萬，**取代而非相加**）
- 展開細項按鈕（右側卡片式按鈕，顯示 `已選/總數`）
- 細項面板：全選 / 全取消按鈕、卡片式 checkbox、備註 textarea
- 底部 sticky 合計欄（深綠背景，即時加總）

### PDF 匯出
- 使用 html2canvas + jsPDF（動態載入 CDN）
- **手機與電腦皆支援**（不用 window.print）
- 匯出內容：基本資料、已勾選項目、勾選細項（tag 樣式）、各項備註、補助合計
- 匯出時顯示旋轉 loading 動畫

---

## 已知問題 / 待改進

- [ ] 尚未在手機實機上完整測試 PDF 輸出品質
- [ ] 加碼條件目前只有「居家安全」項目有，其他項目未來若有類似邏輯需擴充
- [ ] 無資料持久化（重整頁面勾選資料消失）

---

## 重要邏輯說明

### 加碼補助邏輯
```js
// 錯誤（已修正前）: cap + bonus = 20 + 30 = 50
// 正確: bonus 取代 cap = 30
const effectiveCap = (item.id === "safety" && bonus) ? item.bonus : cap;
```

### 室內鎖定判斷
```js
const hasOutdoor = ITEMS.outdoor.items.some(i => checked[i.id]);
const isLocked = gKey === "indoor" && !hasOutdoor;
```

### 立面修繕樓層
```js
const getCap = (item) => item.floorBased ? FLOORS[floor].cap : item.cap;
// FLOORS = [100萬, 200萬, 300萬]
```

---

## 部署流程

```bash
# 開發
npm install
npm run dev

# 推上去（會自動觸發 GitHub Actions build + deploy）
git add .
git commit -m "說明"
git push origin main
```

GitHub Actions 設定在 `.github/workflows/deploy.yml`，
Pages 設定需在 repo Settings → Pages → Source 選 **GitHub Actions**。

---

## 下一步建議

接手後可優先處理：
1. 手機 PDF 匯出實機測試
2. localStorage 儲存勾選狀態（避免重整遺失）
3. 可考慮將資料層（ITEMS/SUBITEMS）抽成獨立 `data.js` 方便維護
