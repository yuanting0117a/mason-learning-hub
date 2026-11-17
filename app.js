const $=id=>document.getElementById(id);
let files=[];
const MANIFEST="file-index.json";
const TYPE_LABEL={pdf:"PDF",md:"MD",markdown:"MD",txt:"TXT",png:"PNG",jpg:"JPG",jpeg:"JPG",gif:"GIF",webp:"WEBP",svg:"SVG",docx:"DOCX",pptx:"PPTX",xlsx:"XLSX",csv:"CSV",zip:"ZIP"};
const IMAGE_TYPES=new Set(["png","jpg","jpeg","gif","webp","svg"]);
const TEXT_TYPES=new Set(["md","markdown","txt","csv"]);
function extOf(file){return String(file.type||file.path?.split(".").pop()||"file").toLowerCase().replace(/^\./,"")}
function safePath(path){
 if(typeof path!=="string"||!path.startsWith("files/")||path.includes("..")||path.startsWith("/")||path.includes("\\\\"))return null;
 return path.split("/").map(encodeURIComponent).join("/");
}
function fileUrl(file){const path=safePath(file.path);return path?new URL(path,document.baseURI).href:null}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function prettyDate(value){if(!value)return "日期未提供";const d=new Date(value+"T00:00:00");return Number.isNaN(d.getTime())?value:d.toLocaleDateString("zh-TW",{year:"numeric",month:"2-digit",day:"2-digit"})}
function prettySize(size){if(!Number.isFinite(Number(size))||Number(size)<=0)return "";const n=Number(size);return n<1024? n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB"}
function populateFilter(id,values,label){const el=$(id);el.innerHTML='<option value="">'+label+'</option>'+values.filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b),"zh-TW")).map(v=>'<option value="'+escapeHtml(v)+'">'+escapeHtml(v)+'</option>').join("")}
function render(){
 const q=$("searchInput").value.trim().toLocaleLowerCase(),category=$("categoryFilter").value,type=$("typeFilter").value;
 const filtered=files.filter(f=>{
  const hay=[f.name,f.description,f.category,...(f.tags||[]),extOf(f)].join(" ").toLocaleLowerCase();
  return (!q||hay.includes(q))&&(!category||f.category===category)&&(!type||extOf(f)===type);
 });
 $("resultSummary").textContent="顯示 "+filtered.length+" / "+files.length+" 個檔案";
 $("fileGrid").innerHTML=filtered.length?filtered.map(f=>{
  const url=fileUrl(f),ext=extOf(f),label=TYPE_LABEL[ext]||ext.toUpperCase().slice(0,5)||"FILE";
  const tags=(f.tags||[]).slice(0,5).map(t=>"<span>"+escapeHtml(t)+"</span>").join("");
  const size=prettySize(f.size);
  return '<article class="file-card">'+
   '<div class="card-head"><span class="file-type '+escapeHtml(ext)+'">'+escapeHtml(label)+'</span><span class="file-size">'+escapeHtml(size)+'</span></div>'+
   '<h3>'+escapeHtml(f.name||"未命名檔案")+'</h3>'+
   '<p class="file-description">'+escapeHtml(f.description||"尚未提供檔案說明。")+'</p>'+
   '<div class="file-tags">'+(f.category?'<span>'+escapeHtml(f.category)+'</span>':"")+tags+'</div>'+
   '<div class="file-meta"><span>'+escapeHtml(prettyDate(f.updated))+'</span><span>'+escapeHtml(f.category||"未分類")+'</span></div>'+
   '<div class="card-actions">'+(url&&(["pdf",...IMAGE_TYPES,...TEXT_TYPES].includes(ext))?'<button type="button" data-preview="'+escapeHtml(f.id)+'">預覽</button>':'')+(url?'<a class="download" href="'+escapeHtml(url)+'" download>下載檔案 ↓</a>':'<span>檔案路徑無效</span>')+'</div>'+
   '</article>';
 }).join(""):'<div class="empty-state"><strong>找不到符合條件的檔案</strong>請調整搜尋文字或篩選條件。</div>';
}
async function loadIndex(){
 try{
  const response=await fetch(MANIFEST,{cache:"no-store"});
  if(!response.ok)throw new Error("檔案清單讀取失敗（HTTP "+response.status+"）");
  const data=await response.json();
  if(!Array.isArray(data.files))throw new Error("file-index.json 格式錯誤：files 必須是陣列。");
  files=data.files.filter(f=>f&&typeof f==="object"&&safePath(f.path));
  populateFilter("categoryFilter",[...new Set(files.map(f=>f.category))],"全部分類");
  populateFilter("typeFilter",[...new Set(files.map(extOf))],"全部格式");
  render();
 }catch(error){
  $("resultSummary").textContent="無法載入檔案清單";
  $("fileGrid").innerHTML='<div class="empty-state"><strong>檔案清單暫時無法讀取</strong>'+escapeHtml(error.message)+'</div>';
 }
}
async function showPreview(id){
 const file=files.find(f=>String(f.id)===String(id));if(!file)return;
 const url=fileUrl(file),ext=extOf(file);if(!url)return;
 $("previewTitle").textContent=file.name||"檔案預覽";
 $("previewType").textContent=(TYPE_LABEL[ext]||ext.toUpperCase())+" PREVIEW";
 $("previewDownload").href=url;$("previewDownload").setAttribute("download",file.name||"");
 const body=$("previewBody");body.innerHTML='<div class="loading-card">正在載入預覽…</div>';
 $("previewDialog").showModal();
 if(ext==="pdf"){
  body.innerHTML='<iframe title="'+escapeHtml(file.name||"PDF 預覽")+'" src="'+escapeHtml(url)+'#view=FitH" loading="lazy"></iframe>';
 }else if(IMAGE_TYPES.has(ext)){
  const img=document.createElement("img");img.alt=file.name||"圖片預覽";img.src=url;body.replaceChildren(img);
 }else if(TEXT_TYPES.has(ext)){
  try{
   const response=await fetch(url);if(!response.ok)throw new Error("無法讀取檔案內容");
   const text=await response.text();
   const pre=document.createElement("pre");pre.textContent=text;body.replaceChildren(pre);
  }catch(error){body.innerHTML='<div class="unsupported">'+escapeHtml(error.message)+'。你仍可使用下方按鈕下載檔案。</div>'}
 }else{
  body.innerHTML='<div class="unsupported">此格式不支援瀏覽器內預覽。<br>請使用下方按鈕下載後開啟。</div>';
 }
}
$("fileGrid").addEventListener("click",event=>{
 const button=event.target.closest("[data-preview]");if(button)showPreview(button.dataset.preview);
});
$("closePreview").addEventListener("click",()=>$("previewDialog").close());
$("previewDialog").addEventListener("click",event=>{if(event.target===$("previewDialog"))$("previewDialog").close()});
$("searchInput").addEventListener("input",render);
$("categoryFilter").addEventListener("change",render);
$("typeFilter").addEventListener("change",render);
loadIndex();
