# 進階：設定 Mason GPT Action（選用）

> **目前不需要設定這個功能。** Mason 分享頁已內建「貼上分析結果 → 匯入 Notion」，不需要 GPT Builder。以下僅供未來帳戶支援自訂 GPT Actions、且希望完全自動 POST 時參考。

## 1. 建立 Action

1. 在 ChatGPT 開啟 GPT Builder，建立或編輯一個自訂 GPT。
2. 開啟 **Configure / 設定 → Actions / 動作 → Create new action**。
3. 將下列 OpenAPI Schema 完整貼入 Schema 欄位：
   - 原始檔： https://raw.githubusercontent.com/yuanting0117a/mason-learning-hub/main/openapi.yaml
4. Authentication 選 **None**。分享 token 已包含在 URL 路徑中；不要另外設定或貼入 Notion Token、Cloudflare Secret。
5. 儲存 Action。確認可看到兩個操作：
   - `getMasonLesson`：GET 讀取影片與逐字稿
   - `importMasonAnalysis`：POST 匯入 Markdown 分析

## 2. 將以下指示加入 GPT Instructions

你是 Mason 英文學習助理。使用者貼上 Mason 分享網址時：

1. 立即呼叫 `getMasonLesson` 讀取該網址對應的影片資料。
2. 忠實保留 transcript 原文，不得自行補寫、刪除或改動逐字稿。
3. 產出完整英文學習紀錄，至少包含：核心詞彙與片語、句型解析、自然度與語域、逐字稿修正建議（只做分析，不覆蓋原文）、英檢中高級口說與寫作可用表達、複習重點。
4. 完成分析後，必須呼叫 `importMasonAnalysis`，使用同一個 token，將完整 Markdown 放在 JSON 的 `analysis` 欄位。
5. 只有收到 API 回覆 `imported: true` 才能告知使用者匯入成功；若失敗，清楚呈現錯誤，不可假稱成功。
6. 若 GET 回覆 `imported: true`，不要重複建立內容，告知這筆資料已匯入。

## 3. 每次使用

1. 在 Mason Learning Hub 貼上 YouTube 網址、確認逐字稿。
2. 按「保存並產生唯一連結」。
3. 將產生的那一條分享網址貼給已設定 Mason Action 的 GPT。
4. GPT 會讀取同一條網址並透過 POST 匯入 Notion。

## 安全提醒

分享網址是持有者即可讀取及匯入的私密連結。不要公開貼到社群或傳給不信任的人。Notion Token 保留在 Cloudflare Worker，絕對不要放進 GPT Instructions 或 Action Schema。
