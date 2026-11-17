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

/* v0.9.1 direct upload through authenticated Cloudflare Worker */
const API_BASE="https://mason-learning-api.yuanting0117a.workers.dev";
let selectedUploads=[];\nlet githubReady=false;
function setUploadStatus(message,type=""){const el=$("uploadStatus");el.textContent=message;el.className=type}
function showSelectedFiles(){
 const el=$("selectedFiles");
 el.textContent=selectedUploads.length?selectedUploads.map(f=>f.name+" ("+prettySize(f.size)+")").join("、"):"尚未選擇檔案";
 $("uploadButton").disabled=!selectedUploads.length||!$("adminPassword").value.trim()||!githubReady;
}
function chooseFiles(list){
 const incoming=Array.from(list||[]);
 const seen=new Set(selectedUploads.map(f=>f.name+":"+f.size+":"+f.lastModified));
 for(const f of incoming){const key=f.name+":"+f.size+":"+f.lastModified;if(!seen.has(key)){selectedUploads.push(f);seen.add(key)}}
 showSelectedFiles();
}
$("fileInput").addEventListener("change",e=>chooseFiles(e.target.files));
$("adminPassword").addEventListener("input",showSelectedFiles);
const dropZone=$("dropZone");
["dragenter","dragover"].forEach(name=>dropZone.addEventListener(name,e=>{e.preventDefault();dropZone.classList.add("dragover")}));
["dragleave","drop"].forEach(name=>dropZone.addEventListener(name,e=>{e.preventDefault();dropZone.classList.remove("dragover")}));
dropZone.addEventListener("drop",e=>chooseFiles(e.dataTransfer.files));
function uploadOne(file,password,index,total){
 return new Promise((resolve,reject)=>{
  const row=document.createElement("div");row.className="upload-progress-item";
  const name=document.createElement("strong");name.textContent=file.name;
  const status=document.createElement("small");status.textContent="準備上傳";
  const progress=document.createElement("progress");progress.max=100;progress.value=0;
  row.append(name,status,progress);$("uploadProgressList").append(row);
  const form=new FormData();form.append("file",file,file.name);
  form.append("category",$("uploadCategory").value.trim());
  form.append("tags",$("uploadTags").value.trim());
  form.append("description",$("uploadDescription").value.trim());
  const xhr=new XMLHttpRequest();xhr.open("POST",API_BASE+"/api/files/upload");
  xhr.setRequestHeader("X-App-Password",password);
  xhr.upload.onprogress=e=>{if(e.lengthComputable){const percent=Math.round(e.loaded/e.total*100);progress.value=percent;status.textContent=percent+"%"}};
  xhr.onload=()=>{
   let data={};try{data=JSON.parse(xhr.responseText)}catch{}
   if(xhr.status>=200&&xhr.status<300&&data.uploaded){
    progress.value=100;status.textContent="完成";
    files.unshift(data.item);
    populateFilter("categoryFilter",[...new Set(files.map(x=>x.category))],"全部分類");
    populateFilter("typeFilter",[...new Set(files.map(extOf))],"全部格式");
    render();resolve(data.item);
   }else{status.textContent="失敗";reject(new Error(data.error||"上傳失敗（HTTP "+xhr.status+"）"))}
  };
  xhr.onerror=()=>{status.textContent="連線失敗";reject(new Error("無法連線到上傳服務。"))};
  xhr.onabort=()=>{status.textContent="已取消";reject(new Error("上傳已取消。"))};
  xhr.send(form);
 });
}
$("uploadButton").addEventListener("click",async()=>{
 const password=$("adminPassword").value.trim();
 if(!password){setUploadStatus("請輸入網站管理密碼。","error");return}
 if(!selectedUploads.length)return;
 const batch=selectedUploads.slice();
 $("uploadButton").disabled=true;$("fileInput").disabled=true;
 $("uploadProgressList").replaceChildren();
 let completed=0,failed=[];
 setUploadStatus("準備上傳 "+batch.length+" 個檔案……");
 for(let i=0;i<batch.length;i++){
  const file=batch[i];
  if(file.size>8*1024*1024){failed.push(file.name+"：超過 8 MB");continue}
  try{await uploadOne(file,password,i+1,batch.length);completed++}
  catch(error){failed.push(file.name+"："+error.message)}
  setUploadStatus("已完成 "+completed+" / "+batch.length+(failed.length?"；失敗 "+failed.length+" 個":""));
 }
 selectedUploads=[];$("fileInput").value="";showSelectedFiles();
 $("uploadButton").disabled=true;$("fileInput").disabled=false;
 if(failed.length)setUploadStatus("完成 "+completed+" 個；失敗 "+failed.length+" 個："+failed.join("；"),"error");
 else setUploadStatus("全部 "+completed+" 個檔案已上傳並加入檔案清單。","success");
});
showSelectedFiles();

async function checkGithubConnection(){
 const password=$("adminPassword").value.trim();
 if(!password){githubReady=false;$("githubStatus").textContent="請先輸入網站管理密碼。";$("githubStatus").className="";showSelectedFiles();return}
 try{
  const response=await fetch(API_BASE+"/api/files/status",{headers:{"X-App-Password":password}});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"無法檢查 GitHub 連線");
  githubReady=!!data.configured;
  $("githubStatus").textContent=githubReady?"GitHub 已連線，可以上傳檔案。":"尚未設定 GitHub Token。請建立 Fine-grained Token 並安全儲存。";
  $("githubStatus").className=githubReady?"success":"";
 }catch(error){githubReady=false;$("githubStatus").textContent=error.message;$("githubStatus").className="error"}
 showSelectedFiles();
}
$("adminPassword").addEventListener("change",checkGithubConnection);
$("adminPassword").addEventListener("blur",()=>{if($("adminPassword").value.trim()&&!githubReady)checkGithubConnection()});
$("connectGithub").addEventListener("click",async()=>{
 const password=$("adminPassword").value.trim(),token=$("githubToken").value.trim();
 if(!password){$("githubStatus").textContent="請先輸入網站管理密碼。";$("githubStatus").className="error";return}
 if(!token){$("githubStatus").textContent="請貼上 GitHub Token。";$("githubStatus").className="error";return}
 const button=$("connectGithub");button.disabled=true;button.textContent="正在驗證…";
 try{
  const response=await fetch(API_BASE+"/api/files/connect",{method:"POST",headers:{"Content-Type":"application/json","X-App-Password":password},body:JSON.stringify({token})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Token 設定失敗");
  $("githubToken").value="";githubReady=true;
  $("githubStatus").textContent="GitHub 已連線，Token 已加密儲存。現在可以上傳檔案。";$("githubStatus").className="success";
 }catch(error){githubReady=false;$("githubStatus").textContent=error.message;$("githubStatus").className="error"}
 finally{button.disabled=false;button.textContent="安全儲存 Token";showSelectedFiles()}
});
