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
