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
function shareUrl(file){const path=safePath(file.path);return path?"https://yuanting0117a.github.io/mason-learning-hub/"+path:null}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function prettyDate(value){if(!value)return "日期未提供";const d=new Date(value+"T00:00:00");return Number.isNaN(d.getTime())?value:d.toLocaleDateString("zh-TW",{year:"numeric",month:"2-digit",day:"2-digit"})}
function prettySize(size){if(!Number.isFinite(Number(size))||Number(size)<0)return "";const n=Number(size);return n<1024? n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB"}
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
   '<div class="card-actions">'+(url&&(["pdf",...IMAGE_TYPES,...TEXT_TYPES].includes(ext))?'<button type="button" data-preview="'+escapeHtml(f.id)+'">預覽</button>':'')+(url?'<button type="button" data-share="'+escapeHtml(f.id)+'">分享連結</button><a class="download" href="'+escapeHtml(url)+'" download>下載檔案 ↓</a>':'<span>檔案路徑無效</span>')+'</div>'+
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
async function shareFile(id,button){
 const file=files.find(f=>String(f.id)===String(id));if(!file)return;
 const url=shareUrl(file);if(!url)return;
 try{
  await navigator.clipboard.writeText(url);
  const original=button.textContent;button.textContent="已複製連結";
  button.disabled=true;
  setTimeout(()=>{button.textContent=original;button.disabled=false},1800);
 }catch(error){
  window.prompt("複製以下公開分享連結：",url);
 }
}
$("fileGrid").addEventListener("click",event=>{
 const shareButton=event.target.closest("[data-share]");
 if(shareButton){shareFile(shareButton.dataset.share,shareButton);return}
 const button=event.target.closest("[data-preview]");if(button)showPreview(button.dataset.preview);
});
$("closePreview").addEventListener("click",()=>$("previewDialog").close());
$("previewDialog").addEventListener("click",event=>{if(event.target===$("previewDialog"))$("previewDialog").close()});
$("searchInput").addEventListener("input",render);
$("categoryFilter").addEventListener("change",render);
$("typeFilter").addEventListener("change",render);
loadIndex();

/* v1.0.0 direct browser-to-GitHub uploads; no Cloudflare upload proxy */
const GITHUB_OWNER="yuanting0117a";
const GITHUB_REPO="mason-learning-hub";
const GITHUB_BRANCH="main";
const GITHUB_API="https://api.github.com";
const MAX_UPLOAD_SIZE=8*1024*1024;
let selectedUploads=[];
let githubToken="";
let githubReady=false;
function setUploadStatus(message,type=""){const el=$("uploadStatus");el.textContent=message;el.className=type}
function showSelectedFiles(){
 const el=$("selectedFiles");
 el.textContent=selectedUploads.length?selectedUploads.map(f=>f.name+" ("+prettySize(f.size)+")").join("、"):"尚未選擇檔案";
 $("uploadButton").disabled=!selectedUploads.length||!githubReady;
}
function chooseFiles(list){
 const incoming=Array.from(list||[]);
 const byKey=new Map(selectedUploads.map(f=>[f.name+":"+f.size+":"+f.lastModified,f]));
 for(const f of incoming)byKey.set(f.name+":"+f.size+":"+f.lastModified,f);
 selectedUploads=Array.from(byKey.values());
 showSelectedFiles();
restoreGithubConnection();
}
$("fileInput").addEventListener("change",e=>chooseFiles(e.target.files));
const dropZone=$("dropZone");
["dragenter","dragover"].forEach(name=>dropZone.addEventListener(name,e=>{e.preventDefault();dropZone.classList.add("dragover")}));
["dragleave","drop"].forEach(name=>dropZone.addEventListener(name,e=>{e.preventDefault();dropZone.classList.remove("dragover")}));
dropZone.addEventListener("drop",e=>chooseFiles(e.dataTransfer.files));
function githubHeaders(json=false){
 const headers={"Authorization":"Bearer "+githubToken,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
 if(json)headers["Content-Type"]="application/json";
 return headers;
}
async function githubRequest(url,options={}){
 const response=await fetch(url,{...options,headers:{...githubHeaders(!!options.body),...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.message||"GitHub API 錯誤（HTTP "+response.status+"）");
 return data;
}
async function connectGithub(savedToken=null){
 const token=(savedToken||$("githubToken").value).trim();
 if(!token){$("githubStatus").textContent="請貼上 GitHub Token。";$("githubStatus").className="error";return}
 const button=$("connectGithub");button.disabled=true;button.textContent="正在驗證…";
 githubToken=token;
 try{
  await githubRequest(GITHUB_API+"/repos/"+GITHUB_OWNER+"/"+GITHUB_REPO+"/contents/file-index.json");
  githubReady=true;
  try{localStorage.setItem("masonGithubToken",token)}catch(storageError){}
  $("githubToken").value="";
  $("githubStatus").textContent="GitHub 已連線。此瀏覽器已記住 Token，下次開啟網站會自動連線。";
  $("githubStatus").className="success";
 }catch(error){
  githubToken="";githubReady=false;
  try{localStorage.removeItem("masonGithubToken")}catch(storageError){}
  $("githubStatus").textContent="連線失敗："+error.message+"。請確認 Token 有此 Repository 的 Contents 讀寫權限。";
  $("githubStatus").className="error";
 }finally{
  button.disabled=false;button.textContent="連線 GitHub";showSelectedFiles();
 }
}
$("connectGithub").addEventListener("click",()=>connectGithub());
async function restoreGithubConnection(){
 let savedToken="";
 try{savedToken=localStorage.getItem("masonGithubToken")||""}catch(error){}
 if(!savedToken)return;
 $("githubStatus").textContent="正在恢復上次的 GitHub 連線…";
 $("githubStatus").className="";
 await connectGithub(savedToken);
}
function safeGitHubFilename(name){
 return String(name||"file").normalize("NFC").replace(/[\/\\?%*:|"<>]/g,"_").replace(/^\.+/,"").trim()||"file";
}
function toBase64(file){
 return file.arrayBuffer().then(buffer=>{
  const bytes=new Uint8Array(buffer);let binary="";
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  return btoa(binary);
 });
}
async function putGitHubFile(path,content,message,sha){
 const body={message,content,branch:GITHUB_BRANCH};
 if(sha)body.sha=sha;
 const encodedPath=path.split("/").map(encodeURIComponent).join("/");
 return githubRequest(GITHUB_API+"/repos/"+GITHUB_OWNER+"/"+GITHUB_REPO+"/contents/"+encodedPath,{
  method:"PUT",body:JSON.stringify(body)
 });
}
async function getManifest(){
 const data=await githubRequest(GITHUB_API+"/repos/"+GITHUB_OWNER+"/"+GITHUB_REPO+"/contents/file-index.json?ref="+GITHUB_BRANCH);
 const binary=atob(data.content.replace(/\n/g,""));
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const decoded=new TextDecoder().decode(bytes);
 return {sha:data.sha,manifest:JSON.parse(decoded)};
}
async function uploadOne(file,index,total){
 const row=document.createElement("div");row.className="upload-progress-item";
 const name=document.createElement("strong");name.textContent=file.name;
 const status=document.createElement("small");status.textContent="讀取檔案…";
 const progress=document.createElement("progress");progress.max=100;progress.value=0;
 row.append(name,status,progress);$("uploadProgressList").append(row);
 try{
  if(file.size===0)throw new Error("檔案大小為 0 B；請確認檔案已儲存，再重新選取。");
  if(file.size>MAX_UPLOAD_SIZE)throw new Error("超過 8 MB 上限。");
  const base64=await toBase64(file);
  const safeName=safeGitHubFilename(file.name);
  const uniqueName=Date.now()+"-"+index+"-"+safeName;
  const path="files/"+uniqueName;
  status.textContent="上傳至 GitHub…";progress.value=15;
  await putGitHubFile(path,base64,"Add file: "+safeName);
  progress.value=70;status.textContent="更新檔案索引…";
  const {sha,manifest}=await getManifest();
  if(!Array.isArray(manifest.files))manifest.files=[];
  const ext=(safeName.split(".").pop()||"file").toLowerCase();
  const item={
   id:uniqueName,
   name:file.name,
   path,
   size:file.size,
   type:ext,
   category:$("uploadCategory").value.trim()||"未分類",
   tags:$("uploadTags").value.split(/[,，]/).map(x=>x.trim()).filter(Boolean),
   description:$("uploadDescription").value.trim(),
   updated:new Date().toISOString().slice(0,10)
  };
  manifest.files.unshift(item);
  await putGitHubFile("file-index.json",btoa(unescape(encodeURIComponent(JSON.stringify(manifest,null,2)+"\n"))),"Update file index: "+safeName,sha);
  progress.value=100;status.textContent="完成";
  return item;
 }catch(error){status.textContent="失敗";throw error}
}
$("uploadButton").addEventListener("click",async()=>{
 if(!githubReady||!githubToken){setUploadStatus("請先連線 GitHub。","error");return}
 if(!selectedUploads.length)return;
 const batch=selectedUploads.slice();
 $("uploadButton").disabled=true;$("fileInput").disabled=true;
 $("uploadProgressList").replaceChildren();
 let completed=0;const failed=[];
 setUploadStatus("直接上傳至 GitHub，共 "+batch.length+" 個檔案…");
 for(let i=0;i<batch.length;i++){
  try{
   const item=await uploadOne(batch[i],i+1,batch.length);
   files.unshift(item);completed++;
   populateFilter("categoryFilter",[...new Set(files.map(x=>x.category))],"全部分類");
   populateFilter("typeFilter",[...new Set(files.map(extOf))],"全部格式");
   render();
  }catch(error){failed.push(batch[i].name+"："+error.message)}
  setUploadStatus("已完成 "+completed+" / "+batch.length+(failed.length?"；失敗 "+failed.length+" 個":""));
 }
 selectedUploads=[];$("fileInput").value="";showSelectedFiles();
 $("fileInput").disabled=false;
 if(failed.length)setUploadStatus("完成 "+completed+" 個；失敗 "+failed.length+" 個："+failed.join("；"),"error");
 else setUploadStatus("全部 "+completed+" 個檔案已直接上傳 GitHub，並更新公開檔案清單。","success");
});
showSelectedFiles();
