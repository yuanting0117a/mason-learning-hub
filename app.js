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
 return `# GPT 英文教材品質檢查與 Notion 整理任務

你是英文教材編輯。請檢查下方 Gemini 教材，保留原本影片順序及「逐句中英對照、重點穿插在文章中間」的版式，不要把教材改成只有單字清單的摘要。

## 一、不可變更的來源資料
- 影片發布日期（使用者手動輸入，優先採用）：${m.date}
- YouTube 連結：${m.url}
- 頻道名稱：${m.channel}
- 分類：${m.category}
- Notion 資料庫：英文教材紀錄
- Data Source ID：418c88fc-35de-814c-be2e-000b30e4594d

## 二、檢查工作
1. 檢查英文拼字、文法、標點及中文翻譯。
2. 檢查逐句中英對照是否一一對應、順序是否一致。
3. 保留有權使用的完整逐字稿；若來源內容不具完整重製授權，請改為摘要／改述，不得補造或重建完整原文。
4. 檢查單字、片語、文法與口語解析是否正確，並且放在文章相關句子之後。
5. 移除錯誤、重複、無關或沒有根據的解析；不確定處標示「待確認」。
6. 檢查練習題答案是否正確，修正題目歧義。
7. 不可猜測或更改手動輸入的發布日期。

## 三、Notion 欄位對應
請沿用現有資料庫，不建立新資料庫：
- 影片名稱：使用實際影片標題；無法驗證時標示待確認。
- 影片連結：${m.url}
- 影片發布日期：${m.date}
- 學習狀態：待學習
- 來源分類：依資料庫現有選項選擇最合適項目；不確定時先詢問，不要自行新增選項。
- 來源名稱／頻道：${m.channel}
- 教材形式：影片
- 內容狀態：有內容（完成檢查後才設定）
- 教材正文：保留逐句中英對照及文章內穿插的解析、練習題與答案。

## 四、匯入前防重複
請先在「英文教材紀錄」搜尋相同 YouTube 影片 ID 或影片連結。
- 若已存在：不要建立第二筆；告知既有頁面並提出更新方案。
- 若不存在：整理完成後建立新頁面。
- 不可覆蓋其他影片或不相關資料。

## 五、執行與回報
若你目前能使用已連線的 Notion 工具，請先完成檢查，再建立或更新正確頁面；若無法存取 Notion，請輸出可直接貼入 Notion 的完整 Markdown，並明確說明尚未匯入。不可聲稱已匯入，除非工具回報成功。
匯入後回報 Notion 頁面連結及使用的發布日期。

## 六、Gemini 原始輸出
以下為完整輸入，請以此為基礎檢查，不要忽略內容：

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
