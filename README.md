# English Learning Hub

多來源英文教材入口：網站負責收集與保存，Gemini 製作教材，GPT 負責匯入 Notion。

## 使用流程
1. 選擇來源分類：Mason、Podcast、YouTube 頻道、TED／演講、新聞／媒體、線上課程或其他。
2. 填入來源名稱、教材形式與教材連結。
3. YouTube 影片可嘗試自動讀取標題與英文字幕；Podcast、文章及其他平台可手動貼上逐字稿或原文。
4. 產生 Gemini 指令，將來源資料與原始內容交給 Gemini 製作教材。
5. 把 Gemini 的完整教材貼回網站，輸入網站管理密碼並保存。
6. 網站會把原始內容、Gemini 教材與來源資訊保存到 Cloudflare KV，並顯示待 GPT 匯入紀錄。
7. 在教材紀錄中複製「GPT 匯入指令」，貼給 ChatGPT。GPT 會用已連接的 Notion 工具查重並新增或更新既有資料。
8. GPT 回報成功後，把 Notion 頁面連結貼回網站，按「標記已匯入」。

## 來源分類
- Mason
- Podcast
- YouTube 頻道
- TED／演講
- 新聞／媒體
- 線上課程
- 其他

來源名稱可自行填寫，亦可使用欄位提示的常見來源。分類不是封閉清單，新增頻道或 Podcast 不需要改程式。

## 架構
- Frontend: GitHub Pages
- API: Cloudflare Worker `mason-learning-api`
- Queue/history: Cloudflare KV binding `LESSONS`
- Notion: 英文教材紀錄 Data Source `418c88fc-35de-814c-be2e-000b30e4594d`
- Worker secrets: `APP_PASSWORD`, `GPT_READ_KEY`, `NOTION_TOKEN`

## Notion 欄位
既有欄位保留，另新增：
- `來源分類`
- `來源名稱`
- `教材形式`

原始逐字稿／文章與 Gemini 教材會分開放在每筆 Notion 頁面內容。影片發布日期欄位不會由網站自動填寫。

## API
- `POST /api/queue`: 以網站管理密碼保存教材至 KV。
- `GET /api/library`: 以網站管理密碼讀取教材歷史。
- `POST /api/mark-imported`: 以網站管理密碼更新 Notion 匯入狀態與頁面連結。
- `GET /api/pending?key=...`: 舊 GPT 待匯入清單端點，仍保留。
- `GET /api/video`、`GET /api/transcript`: YouTube 影片資訊與字幕。
- 舊分享連結與直接匯入端點仍保留，避免既有連結立即失效。

## 限制
YouTube 不保證所有影片都能自動取得公開字幕。Podcast、Spotify、Apple Podcasts、文章或其他平台的逐字稿需要手動貼入；網站不會假裝已經取得無法讀取的內容。
