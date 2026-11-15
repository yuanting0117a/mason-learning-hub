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
- API：Cloudflare Worker `mason-learning-api`
- Notion：英文教材紀錄 Data Source

## 版本

- v0.8.0：加入手動發布日期、Gemini 提示詞、Gemini 結果貼上區、GPT 檢查／匯入提示詞及整份複製。
- v0.7.0：Notion 唯讀教材庫。
