const API="https://mason-learning-api.yuanting0117a.workers.dev";
const $=id=>document.getElementById(id);
let materials=[];
const endpoint=path=>API.replace(/\/$/,"")+path;
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function setStatus(message,type=""){const el=$("status");el.textContent=message;el.className="status "+type}
function dateText(value){if(!value)return "未記錄";const d=new Date(value+"T00:00:00");return Number.isNaN(d.getTime())?value:d.toLocaleDateString("zh-TW",{year:"numeric",month:"2-digit",day:"2-digit"})}
function textOf(block){return block.text||""}
function renderBlocks(blocks){
 if(!blocks?.length)return '<p class="no-content">這筆教材目前沒有可顯示的頁面內容。</p>';
 return blocks.map(b=>{
  const t=escapeHtml(textOf(b)).replace(/\n/g,"<br>");
  let html="";
  switch(b.type){
   case "heading_1": html='<h2>'+t+'</h2>';break;
   case "heading_2": html='<h3>'+t+'</h3>';break;
   case "heading_3": html='<h4>'+t+'</h4>';break;
   case "paragraph": html=t?'<p>'+t+'</p>':'<div class="block-space"></div>';break;
   case "bulleted_list_item": html='<div class="bullet">• <span>'+t+'</span></div>';break;
   case "numbered_list_item": html='<div class="bullet numbered">1. <span>'+t+'</span></div>';break;
   case "quote": html='<blockquote>'+t+'</blockquote>';break;
   case "callout": html='<aside class="callout">'+t+'</aside>';break;
   case "code": html='<pre><code>'+t+'</code></pre>';break;
   case "divider": html='<hr>';break;
   case "to_do": html='<div class="todo">'+(b.checked?'☑':'☐')+' <span>'+t+'</span></div>';break;
   case "table": html='<div class="table-scroll"><table>'+((b.children||[]).map(row=>'<tr>'+((row.cells||[]).map(cell=>'<td>'+escapeHtml(cell)+'</td>').join(""))+'</tr>').join(""))+'</table></div>';break;
   case "bookmark":
   case "embed":
   case "link_preview": html=b.url?'<p><a href="'+escapeHtml(b.url)+'" target="_blank" rel="noopener">'+(t||escapeHtml(b.url))+' ↗</a></p>':'';break;
   case "image": html=b.url?'<p><a href="'+escapeHtml(b.url)+'" target="_blank" rel="noopener">開啟圖片 ↗</a></p>':'';break;
   default: html=t?'<p>'+t+'</p>':'';
  }
  if(b.children?.length && b.type!=="table")html+='<div class="nested-blocks">'+renderBlocks(b.children)+'</div>';
  return html;
 }).join("");
}
function allText(blocks){return (blocks||[]).map(b=>[b.text||"",...(b.cells||[]),allText(b.children)].join(" ")).join(" ")}
function badgeClass(value){return value==="完成"||value==="有內容"?"green":value==="進行中"||value==="部分內容"?"blue":value==="沒內容"?"red":"gray"}
function fillSelect(id,values,allLabel){
 const el=$(id),old=el.value;
 el.innerHTML='<option value="">'+allLabel+'</option>'+values.filter(Boolean).sort((a,b)=>a.localeCompare(b,"zh-TW")).map(v=>'<option value="'+escapeHtml(v)+'">'+escapeHtml(v)+'</option>').join("");
 if(values.includes(old))el.value=old;
}
function renderStats(){
 const total=materials.length,done=materials.filter(x=>x.learningStatus==="完成").length,active=materials.filter(x=>x.learningStatus==="進行中").length,ready=materials.filter(x=>x.contentStatus==="有內容").length;
 $("stats").innerHTML=[
  ["教材總數",total,"筆教材"],
  ["待學習／進行中",materials.filter(x=>x.learningStatus!=="完成").length,"尚未完成"],
  ["已完成",done,"筆教材"],
  ["內容完整",ready,"筆教材"]
 ].map(([label,value,note])=>'<article class="stat"><span>'+label+'</span><strong>'+value+'</strong><small>'+note+'</small></article>').join("");
}
function renderLibrary(){
 const q=$("search").value.trim().toLocaleLowerCase(),channel=$("channelFilter").value,category=$("categoryFilter").value,status=$("statusFilter").value,content=$("contentFilter").value;
 const rows=materials.filter(m=>{
  const hay=[m.title,m.channel,m.category,m.learningStatus,m.contentStatus,allText(m.blocks)].join(" ").toLocaleLowerCase();
  return (!q||hay.includes(q))&&(!channel||m.channel===channel)&&(!category||m.category===category)&&(!status||m.learningStatus===status)&&(!content||m.contentStatus===content);
 });
 $("resultCount").textContent="找到 "+rows.length+" / "+materials.length+" 筆教材";
 $("library").innerHTML=rows.length?rows.map(m=>{
  const index=materials.indexOf(m),video=m.links?.[0];
  return '<article class="material-card">'+
   '<div class="card-top"><div class="number">'+escapeHtml(m.number||"教材")+'</div><span class="status-pill '+badgeClass(m.learningStatus)+'">'+escapeHtml(m.learningStatus||"未設定")+'</span></div>'+
   '<h3>'+escapeHtml(m.title)+'</h3>'+
   '<div class="chips">'+(m.channel?'<span>'+escapeHtml(m.channel)+'</span>':'')+(m.category?'<span>'+escapeHtml(m.category)+'</span>':'')+'<span class="content-chip '+badgeClass(m.contentStatus)+'">'+escapeHtml(m.contentStatus||"內容未標記")+'</span></div>'+
   '<div class="meta-grid"><div><small>學習日期</small><b>'+dateText(m.learningDate)+'</b></div><div><small>影片發布日期</small><b>'+dateText(m.releaseDate)+'</b></div><div><small>最後複習</small><b>'+dateText(m.reviewDate)+'</b></div></div>'+
   '<div class="card-actions">'+(video?'<a class="action-link" href="'+escapeHtml(video)+'" target="_blank" rel="noopener">觀看原始教材 ↗</a>':'')+'<a class="action-link" href="'+escapeHtml(m.url)+'" target="_blank" rel="noopener">開啟 Notion 頁面 ↗</a></div>'+
   '<details class="content-details"><summary>閱讀教材內容</summary><div class="notion-content">'+renderBlocks(m.blocks)+'</div></details>'+
   '</article>';
 }).join(""):'<div class="empty-state"><strong>沒有符合條件的教材</strong><p>試著清除搜尋文字或篩選條件。</p></div>';
}
async function loadMaterials(){
 const password=$("appPassword").value.trim();
 if(!password){setStatus("請先輸入網站管理密碼。","error");return}
 $("connect").disabled=true;$("refresh").disabled=true;
 setStatus("正在讀取 Notion 教材資料……");
 $("library").innerHTML='<p class="empty">正在載入教材清單……</p>';
 try{
  const r=await fetch(endpoint("/api/materials"),{headers:{"X-App-Password":password}});
  const data=await r.json();if(!r.ok)throw Error(data.error||"讀取教材失敗");
  materials=data.items||[];
  fillSelect("channelFilter",[...new Set(materials.map(x=>x.channel))],"全部頻道");
  fillSelect("categoryFilter",[...new Set(materials.map(x=>x.category))],"全部分類");
  renderStats();renderLibrary();
  $("libraryArea").classList.remove("hidden");
  setStatus("已連線 Notion，共讀取 "+materials.length+" 筆教材。","ok");
 }catch(e){setStatus(e.message,"error");$("library").innerHTML='<div class="empty-state">'+escapeHtml(e.message)+'</div>'}
 finally{$("connect").disabled=false;$("refresh").disabled=false}
}
$("connect").addEventListener("click",loadMaterials);
$("refresh").addEventListener("click",loadMaterials);
$("appPassword").addEventListener("keydown",e=>{if(e.key==="Enter")loadMaterials()});
["search","channelFilter","categoryFilter","statusFilter","contentFilter"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",renderLibrary));


// ── Two-stage prompt generator ──
function workflowMeta(){
 return {
  date:$("releaseDate").value.trim(),
  url:$("videoUrl").value.trim(),
  channel:$("videoChannel").value.trim()||"待確認",
  category:$("videoCategory").value
 };
}
function validVideoUrl(value){
 try{const u=new URL(value);return (u.hostname==="youtu.be"||u.hostname.endsWith("youtube.com"))&&value.trim().length>0}catch{return false}
}
function makeGeminiPrompt(){
 const m=workflowMeta();
 if(!m.date){alert("請先手動輸入影片發布日期。");$("releaseDate").focus();return}
 if(!validVideoUrl(m.url)){alert("請輸入有效的 YouTube 影片連結。");$("videoUrl").focus();return}
 return `# 英文教材製作任務（Gemini）

請分析以下 YouTube 影片，製作適合英檢中高級學習者的完整學習教材。

## 影片基本資料（以此為準，不可自行更改）
- 影片發布日期（使用者手動輸入）：${m.date}
- 影片連結：${m.url}
- 頻道名稱：${m.channel}
- 教材分類：${m.category}

## 一、影片內容與逐字稿
1. 先確認影片內容、語言及可取得的字幕／逐字稿。
2. 若使用者擁有逐字稿、已取得授權，或影片內容屬公眾領域，請保留完整英文逐字稿，不要刪句、摘要或自行改寫；盡可能保留時間戳記。
3. 若無法確認重製授權，不要輸出整部影片的逐字稿或逐句完整翻譯。改為依影片順序提供逐句層級的英文改述／摘要與繁體中文對照，避免重現原文的長段落。
4. 無法讀取影片或字幕時，明確說明讀取失敗，請使用者提供有權使用的逐字稿；不可捏造內容。
5. 不要把 AI 推測的發布日期覆蓋使用者輸入的日期。

## 二、逐句中英對照排版
依影片內容順序編排。每個英文句子或經授權的逐字稿句子，下一行立即放對應繁體中文翻譯。不要先放完英文再集中翻譯。
每句可附影片時間戳記。保持句子順序，不要任意合併或省略。

## 三、重點穿插在文章中間
重要解析必須放在它第一次出現的相關句子後方，不要全部集中到文章最後：
- 核心單字：詞性、繁體中文意思、語境、常見搭配、自然例句。
- 重要片語／慣用語：意思、語氣、使用情境及替換說法。
- 文法句型：結構、功能、易錯點及例句。
- 口語與發音：值得注意的連音、弱讀、語調或自然表達。
同一個重點不必重複解釋；難度以英檢中高級為主，避免收錄過多基礎詞彙。

## 四、文章後段的學習整理
1. 影片主題與內容摘要。
2. 精選重點總表（只收錄文章中已解釋的重點）。
3. 英檢中高級口說與寫作應用。
4. 10 題練習題：5 題詞彙片語、3 題文法、2 題語意理解；答案集中放最後。
5. 資料來源與整理日期。

## 五、品質要求
- 全文使用繁體中文解說，英文原文／例句保留英文。
- 翻譯自然、準確，不要逐字硬譯。
- 不要虛構影片沒有出現的句子、時間戳記或詞彙。
- 使用清楚標題、段落與一致格式。
- 最終輸出完整 Markdown，方便交給 GPT 進行第二階段檢查。
`;
}
function makeGptPrompt(){
 const m=workflowMeta(),result=$("geminiResult").value.trim();
 if(!m.date){alert("請先輸入影片發布日期。");$("releaseDate").focus();return}
 if(!validVideoUrl(m.url)){alert("請先輸入有效的 YouTube 影片連結。");$("videoUrl").focus();return}
 if(!result){alert("請先貼上 Gemini 產生的教材。");$("geminiResult").focus();return}
 return `# GPT 最終任務：教材校對、Notion 防重複檢查與實際匯入

你是英文教材總編輯與 Notion 資料管理助理。這不是只產生 Markdown 的任務：**請在完成校對後，使用目前已連線的 Notion 工具，將教材實際寫入指定的既有資料庫。** 不要只告訴使用者如何匯入，也不要建立新資料庫。

## 1. 固定來源資料（不可自行改寫）
- 影片發布日期（使用者在網站手動輸入，唯一可信日期）：${m.date}
- YouTube 影片連結：${m.url}
- 頻道名稱：${m.channel || "未提供"}
- 教材分類：${m.category}
- 既有 Notion 資料庫名稱：Mason 英文影片學習紀錄
- 資料來源名稱：英文教材紀錄
- Notion Data Source ID：418c88fc-35de-814c-be2e-000b30e4594d

日期規則：發布日期必須原封不動使用「${m.date}」。不可從 YouTube、Gemini 文字或其他來源推算、修正、替換日期；若 Notion 日期欄位格式不接受，先轉成相同日期的標準日期格式，不得改變年月日。

## 2. 教材校對
請逐項檢查 Gemini 原始教材：
1. 英文拼字、文法、標點、語意及繁體中文翻譯。
2. 英中逐句是否一一對應，是否依照影片原始順序排列。
3. 單字、片語、文法、慣用語及自然表達是否正確。
4. 每個重點是否緊接在相關句子後面，不要把所有解析搬到文章最後。
5. 時間戳是否合理；無法確認的時間戳標示待確認，不可杜撰。
6. 練習題是否清楚、答案是否正確；修正錯誤或有歧義的題目。
7. 刪除無根據的內容，無法確認的地方標示「待確認」，不可自行編造影片內容。

版式要求：
- 保留影片內容順序。
- 有合法授權或使用者提供可使用的逐字稿時，保留完整逐句中英對照。
- 若沒有完整重製授權，不得重製完整受著作權保護的逐字稿或完整翻譯；改為逐段摘要／改述，仍提供對應繁體中文及緊貼內容的學習解析。
- 保留文章內穿插的解析、整理、練習題與答案。

## 3. Notion 匯入前：先讀取既有資料庫結構
請使用 Notion connector：
1. 先讀取 Data Source ID '418c88fc-35de-814c-be2e-000b30e4594d' 的資料庫結構／欄位 schema，確認實際存在的 property 名稱、型態及選項。
2. 只使用資料庫現有欄位與合法選項。不要假設欄位名稱一定與本提示詞相同；請依實際 schema 對應。
3. 不得新增資料庫、不得任意新增 select 選項，也不得改動資料庫 schema。
4. 將完整教材放入該筆 Notion 頁面的正文區塊（page body），不要只塞進摘要欄位。若內容太長，依 Notion API／connector 限制分段寫入，並確認所有區塊都成功建立。

## 4. 防止重複資料
以 YouTube 影片 ID 為第一比對依據，影片連結為第二比對依據：
- 先查詢既有資料庫，確認是否已有相同影片。
- 若沒有相同影片：建立一筆新頁面。
- 若已有相同影片：不要新增第二筆，也不要直接覆蓋原教材。先比較既有頁面與本次校對結果；若既有頁面內容明顯不完整或有錯，才更新該筆頁面，並保留原有有用資訊。
- 若無法判斷是否為同一影片，停止寫入並向使用者說明，不可冒險建立重複資料。

## 5. 欄位內容對應原則
依照實際 schema 對應以下資料；不存在的欄位不要自行建立：
- 影片標題：使用可驗證的實際標題；無法驗證時標示待確認。
- 影片連結：${m.url}
- 影片發布日期：${m.date}
- 頻道／來源：${m.channel || "未提供"}
- 分類：${m.category}（若資料庫選項不相符，選擇最接近的既有選項；無法合理對應就留空並回報）
- 學習狀態：若有對應欄位，設為「待學習」或 schema 中最接近的既有選項。
- 教材正文：完整放入校對後的教材，包含逐句中英對照／摘要改述、文章內穿插的單字片語文法解析、練習題及答案。

## 6. 必須實際執行寫入並驗證
完成校對與防重複查詢後：
1. 呼叫 Notion 建立頁面或更新既有頁面的工具，目標只能是上述 Data Source。
2. 寫入標題、影片連結、手動日期及其他可對應欄位。
3. 將教材正文寫入頁面內容區塊。
4. 寫入後重新讀取該頁面，確認標題、影片連結、日期及教材正文確實存在。
5. 只有在 Notion 工具回報成功且重新讀取驗證通過後，才能宣稱「已匯入」。

若目前沒有可用的 Notion connector、沒有權限、找不到指定 Data Source，或寫入／驗證失敗：
- 不可假裝已匯入，也不可只回報成功。
- 明確指出失敗原因及尚未完成的步驟。
- 保留完整校對後教材，輸出可供後續匯入的 Markdown。
- 不要建立其他資料庫作為替代品。

## 7. 最終回報格式
完成後簡潔回報：
- 匯入結果：新增／更新／已存在未修改／未匯入
- Notion 頁面連結（若成功）
- 使用的影片發布日期：${m.date}
- 校對修正摘要
- 待確認事項（若無則寫「無」）

## 8. Gemini 原始教材
以下是完整輸入。請完整處理，不要略過後半段：

--- GEMINI MATERIAL START ---
${result}
--- GEMINI MATERIAL END ---`;
}
async function copyField(id,buttonId){
 const value=$(id).value;
 if(!value){alert("目前沒有可複製的提示詞。");return}
 try{await navigator.clipboard.writeText(value);$(buttonId).textContent="已複製全部";setTimeout(()=>$(buttonId).textContent="複製全部",1800)}
 catch{ $(id).focus();$(id).select();alert("瀏覽器未允許自動複製，已選取文字，請按 Ctrl+C。")}
}
$("makeGemini").addEventListener("click",()=>{
 const p=makeGeminiPrompt();if(!p)return;
 $("geminiPrompt").value=p;$("copyGemini").disabled=false;
 $("geminiPrompt").scrollIntoView({behavior:"smooth",block:"nearest"});
});
$("copyGemini").addEventListener("click",()=>copyField("geminiPrompt","copyGemini"));
$("makeGpt").addEventListener("click",()=>{
 const p=makeGptPrompt();if(!p)return;
 $("gptPrompt").value=p;$("copyGpt").disabled=false;
 $("gptPrompt").scrollIntoView({behavior:"smooth",block:"nearest"});
});
$("copyGpt").addEventListener("click",()=>copyField("gptPrompt","copyGpt"));
