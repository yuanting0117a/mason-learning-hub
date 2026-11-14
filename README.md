# Mason Learning Hub

## One-link GPT → Notion workflow
1. Paste a YouTube or Shorts URL.
2. Mason attempts to load title, publication date, and public English captions.
3. Review or edit the transcript; if captions are unavailable, paste the transcript manually.
4. Enter the website access password and click **保存並產生唯一連結**.
5. Copy the single share URL and paste it into a GPT.
6. Configure the Mason GPT Action once using [openapi.yaml](./openapi.yaml). Then paste the single share URL into that configured GPT. The Action reads the transcript with GET and submits the finished Markdown to the same URL with POST.

The Worker stores the share token in KV. The URL is an unguessable bearer capability; anyone who receives it can read the transcript and submit an import. Treat it like a private share link.

### Important compatibility limitation
A plain chat session or arbitrary GPT cannot be assumed to send HTTP POST requests. To automate the import, create or edit a GPT that has the Mason Action configured from [openapi.yaml](./openapi.yaml), with Authentication set to None. The Action exposes GET and POST on the same /api/share/{token} endpoint. Once configured, paste the ordinary Mason share URL into that GPT; it can read the transcript and submit the analysis. GPTs without this Action can still read the share link but cannot reliably perform the Notion import. Notion writes are performed by the Cloudflare Worker using the server-side NOTION_TOKEN; the token is never exposed to the browser or GPT.

## Worker deployment
Worker name: mason-learning-api
Source: worker/worker.js
Required bindings: LESSONS KV, APP_PASSWORD secret, NOTION_TOKEN secret.
Legacy GPT_READ_KEY may remain configured for backwards compatibility with /api/pending, but the new workflow does not require it.

## Existing Notion data source
Data source ID: 418c88fc-35de-814c-be2e-000b30e4594d
Properties: 影片名稱、影片連結、YouTube 影片 ID、影片發布時間、學習日期、學習狀態.
The transcript and GPT analysis are saved as page body sections.

## Caption limitations
YouTube does not guarantee public caption downloads for arbitrary videos. If Mason cannot retrieve captions, paste the transcript manually.