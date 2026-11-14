# Mason Learning Hub

## 一個分享連結 → ChatGPT 整理 → 匯入 Notion
1. 貼上 YouTube 或 Shorts 網址。
2. Mason 嘗試取得影片標題、發布日期與公開英文字幕。
3. 檢查或修改逐字稿；若無法取得字幕，可自行貼上逐字稿。
4. 輸入網站存取密碼，按 **保存並產生唯一連結**。
5. 把分享連結貼給一般 ChatGPT，請它讀取逐字稿並完成英文學習整理。
6. 回到同一個分享連結，把 ChatGPT 的完整 Markdown 結果貼入「ChatGPT 學習整理」欄位，按 **匯入 Notion**。

分享頁同時支援逐字稿閱讀與 Notion 匯入，不需要 GPT Builder、GPT Action 或另外建立帳號。Notion 寫入由 Cloudflare Worker 使用伺服器端的 NOTION_TOKEN 執行，Token 不會暴露給瀏覽器或 ChatGPT。

## 進階：GPT Action 自動匯入（選用）
若帳戶支援自訂 GPT Actions，可參考 [GPT_ACTION_SETUP.md](./GPT_ACTION_SETUP.md) 和 [openapi.yaml](./openapi.yaml)，讓 GPT 直接呼叫同一個分享連結完成 POST。一般分享頁的手動貼上匯入仍可正常使用。

## 分享連結安全
Worker 將分享 token 存在 KV。分享網址是持有者即可讀取逐字稿並提交匯入的私密連結，請勿公開張貼或傳給不信任的人。

## Worker
- Worker：`mason-learning-api`
- Source：`worker/worker.js`
- Required bindings：`LESSONS` KV、`APP_PASSWORD` secret、`NOTION_TOKEN` secret。
- Legacy `GPT_READ_KEY` 可保留，供舊的 `/api/pending` 使用。

## Notion
既有資料庫 Data Source ID：`418c88fc-35de-814c-be2e-000b30e4594d`
Properties：影片名稱、影片連結、YouTube 影片 ID、影片發布時間、學習日期、學習狀態。逐字稿與 ChatGPT 分析會儲存在頁面內容區塊。

## 字幕限制
YouTube 不保證所有影片都能下載公開字幕。若 Mason 無法取得字幕，請手動貼上逐字稿。
