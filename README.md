# 英文教材庫

此專案是 Notion「英文教材紀錄」的唯讀瀏覽網站。網站直接讀取 Notion 現有教材，不再以 Gemini 指令產生器或 KV 待匯入佇列作為主要操作流程。

## 網站功能

1. 使用網站管理密碼連線到 Notion。
2. 顯示教材總數、學習中／待學習、已完成及內容完整數量。
3. 搜尋教材名稱與教材頁面內容。
4. 依頻道、分類、學習狀態、內容狀態篩選。
5. 顯示教材序號、頻道、分類、學習狀態、內容狀態、學習日期、影片發布日期及最後複習日期。
6. 展開教材卡片閱讀 Notion 頁面內容。
7. 直接開啟原始影片或 Notion 教材頁。

## Notion 資料來源

- 資料庫：英文教材紀錄
- Data Source ID：`418c88fc-35de-814c-be2e-000b30e4594d`
- 欄位依照 Notion 現有資料庫讀取，不在網站另外建立一套欄位。
- 網站為唯讀介面；要修改教材內容或學習狀態，請回 Notion 操作。

## 架構

- Frontend：GitHub Pages
- API：Cloudflare Worker `mason-learning-api`
- Notion：英文教材紀錄 Data Source
- Worker secrets：`APP_PASSWORD`、`NOTION_TOKEN`
- Worker bindings：原有 KV 與其他設定保留；舊教材收集／匯入端點暫時保留相容性。

## API

- `GET /api/materials`：以網站管理密碼讀取 Notion 教材、欄位與頁面區塊內容。
- 舊版 `/api/queue`、`/api/library`、`/api/mark-imported`、分享與逐字稿端點仍保留，避免舊連結立即失效；新版網站不再使用它們作為主要流程。

## 版本

- v0.7.0：改為 Notion 教材庫，加入搜尋、篩選、教材內容閱讀及 Notion／原始影片連結。
