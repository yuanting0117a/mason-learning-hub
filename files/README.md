# 公開檔案庫

將要公開的檔案放在這個資料夾，並在網站根目錄的 `file-index.json` 登記檔案資訊。

## 登記格式

每個檔案是一個 JSON 物件：

```json
{
  "id": "unique-id",
  "name": "檔案顯示名稱",
  "path": "files/example.pdf",
  "type": "pdf",
  "description": "檔案簡介",
  "category": "課程教材",
  "tags": ["英文", "閱讀"],
  "updated": "2026-11-17"
}
```

支援 PDF、Markdown、TXT、PNG、JPG、JPEG、GIF、WEBP、SVG、DOCX、PPTX、XLSX、ZIP 等常見格式。瀏覽器可直接預覽的格式會顯示預覽；其他格式提供下載。

## 新增檔案步驟

1. 在 GitHub Repository 的 `files/` 資料夾上傳檔案。
2. 編輯根目錄的 `file-index.json`，新增一筆資料並填入正確路徑。
3. Commit changes。GitHub Pages 更新後，檔案就會出現在公開檔案庫。

注意：這是公開 Repository。放進來的檔案任何人都可能瀏覽或下載，請勿上傳個資、密碼、私人文件或未取得公開授權的教材。
