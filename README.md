# Mason Learning Hub — MVP 0.1

## Current flow
1. Paste a YouTube or Shorts URL.
2. Cloudflare Worker attempts to read title, publication date, and public English captions.
3. Review/edit transcript.
4. Copy the generated prompt into ChatGPT (no OpenAI API key or API billing).
5. Paste the ChatGPT lesson back.
6. Save transcript + lesson into the existing Notion database; duplicate check uses YouTube Video ID.

## Important caption limitation
YouTube has no general public official API that guarantees caption downloads for arbitrary third-party videos. This Worker reads YouTube web-player caption tracks when accessible. YouTube may change or block this endpoint, and some videos have no English captions. This is best-effort only. If it fails, paste the transcript from YouTube Gemini.

## Deploy the Cloudflare Worker
1. Create a Cloudflare Worker named `mason-learning-hub-api`.
2. Upload `worker/worker.js` as the Worker source.
3. In Worker Settings → Variables and Secrets, add secret `NOTION_TOKEN` containing your Notion integration secret.
4. Share the existing Notion data source **Mason 英文影片學習紀錄** with that integration.
5. Test `https://YOUR-WORKER.workers.dev/api/health`.

## Deploy GitHub Pages
1. In `app.js`, replace `https://YOUR-WORKER.workers.dev` with your deployed Worker URL.
2. Repository Settings → Pages → Deploy from branch → `main` → `/(root)`.
3. Wait for the Pages build. The expected address is `https://yuanting0117a.github.io/mason-learning-hub/`.

## Existing Notion data source
Data source ID: `418c88fc-35de-814c-be2e-000b30e4594d`.
Verified properties:
- 影片名稱 (title)
- 影片連結 (url)
- YouTube 影片 ID (text)
- 影片發布時間 (date)
- 學習日期 (date)
- 學習狀態 (select: 待學習 / 進行中 / 完成)

The transcript and ChatGPT analysis are stored as page body sections.

## Security
Never commit the Notion integration token or put it in browser JavaScript. Keep it only in Cloudflare Worker Secrets. This starter version uses permissive CORS and is intended for personal use; restrict CORS and add authentication/rate limiting before making it a public multi-user service.
