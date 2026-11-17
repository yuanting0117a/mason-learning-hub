# 英文教材庫

此專案是 Notion「英文教材紀錄」的教材製作與唯讀瀏覽網站。

## v0.8.0 功能

1. 手動輸入影片發布日期、YouTube 連結、頻道及教材分類。
2. 產生 Gemini 第一階段提示詞。
3. Gemini 教材依逐句中英對照排版；重點單字、片語與文法穿插在相關句子後。
4. 貼上 Gemini 完整輸出，產生 GPT 第二階段品質檢查與 Notion 整理提示詞。
5. 兩組提示詞皆支援「複製全部」。
6. 保留原有 Notion 教材瀏覽、搜尋、篩選功能。

## 版權與內容規則

只有在使用者擁有逐字稿、取得授權或素材屬公眾領域時，提示詞才要求完整逐字稿及完整翻譯。其他影片改用逐句層級的英文摘要／改述與繁體中文對照，不重製整部受版權保護內容。

## Notion 資料來源

- 資料庫：英文教材紀錄
- Data Source ID：`418c88fc-35de-814c-be2e-000b30e4594d`
- GPT 提示詞沿用既有欄位，不建立新資料庫。
- 網站本身不會自動寫入 Notion；由 GPT 在可使用 Notion 連線時檢查重複並執行匯入。

## 架構

- Frontend：GitHub Pages
- 檔案儲存：GitHub Repository 的公開 `files/` 資料夾
- 上傳方式：瀏覽器直接呼叫 GitHub Contents API，不經過 Cloudflare Worker
- GitHub Token：由管理者在瀏覽器輸入，只保留於目前分頁記憶體；不寫入 Repository，也不傳給 Cloudflare
- 檔案清單：上傳成功後由瀏覽器直接更新 `file-index.json`

## 版本

- v1.0.0：移除 Cloudflare Worker 上傳流程，改由瀏覽器直接上傳 GitHub；Token 僅保留在分頁記憶體。
- v0.8.0：加入手動發布日期、Gemini 提示詞、Gemini 結果貼上區、GPT 檢查／匯入提示詞及整份複製。
- v0.7.0：Notion 唯讀教材庫。
