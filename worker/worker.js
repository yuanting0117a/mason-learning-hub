const DATA_SOURCE_ID="418c88fc-35de-814c-be2e-000b30e4594d";
const NOTION_VERSION="2025-09-03";
const cors={ "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type, X-App-Password, Authorization" };
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors}});
function videoId(value){let u;try{u=new URL(value)}catch{throw Error("網址格式不正確。")}let id="";if(u.hostname.includes("youtu.be"))id=u.pathname.split("/").filter(Boolean)[0]||"";else if(u.pathname==="/watch")id=u.searchParams.get("v")||"";else{const p=u.pathname.split("/").filter(Boolean),i=p.findIndex(x=>["shorts","embed","live"].includes(x));if(i>=0)id=p[i+1]||""}if(!/^[\w-]{11}$/.test(id))throw Error("無法辨識 YouTube Video ID。");return id}
function extractObject(s,marker){const p=s.indexOf(marker);if(p<0)return null;const start=s.indexOf("{",p);if(start<0)return null;let depth=0,q=false,e=false;for(let i=start;i<s.length;i++){const c=s[i];if(q){if(e)e=false;else if(c==="\\")e=true;else if(c==='"')q=false;continue}if(c==='"')q=true;else if(c==="{")depth++;else if(c==="}"&&--depth===0){try{return JSON.parse(s.slice(start,i+1))}catch{return null}}}return null}
async function videoInfo(url){
 const id=videoId(url),canonical="https://www.youtube.com/watch?v="+id,shorts="https://www.youtube.com/shorts/"+id;
 const [o,p,s,feed]=await Promise.all([
  fetch("https://www.youtube.com/oembed?url="+encodeURIComponent(canonical)+"&format=json").catch(()=>null),
  fetch(canonical,{headers:{"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36","Accept-Language":"en-US,en;q=0.9"}}).catch(()=>null),
  fetch(shorts,{headers:{"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36","Accept-Language":"en-US,en;q=0.9"}}).catch(()=>null),
  fetch("https://www.youtube.com/feeds/videos.xml?video_id="+encodeURIComponent(id),{headers:{"Accept":"application/atom+xml,application/xml,text/xml"}}).catch(()=>null)
 ]);
 let oe={};if(o?.ok)oe=await o.json().catch(()=>({}));
 const pages=[];
 for(const response of [p,s]){
  if(response?.ok){const html=await response.text();pages.push({html,player:extractObject(html,"ytInitialPlayerResponse")});}
 }
 let player=pages.find(x=>x.player)?.player||null,publishedAt=null,publishedAtSource=null;
 for(const page of pages){
  const m=page.player?.microformat?.playerMicroformatRenderer;
  const direct=m?.publishDate||m?.uploadDate;
  if(direct){publishedAt=direct;publishedAtSource="YouTube 影片頁面（播放器資料）";break;}
  const html=page.html;
  const jsonDate=html.match(/"(?:datePublished|publishDate|uploadDate|dateCreated)"\s*:\s*"([^"]+)"/i)?.[1];
  if(jsonDate){publishedAt=jsonDate;publishedAtSource="YouTube 影片頁面（結構化資料）";break;}
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)];
  for(const tag of metas){
   const attrs={};
   for(const a of tag[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']+)["']/g))attrs[a[1].toLowerCase()]=a[2];
   const key=(attrs.itemprop||attrs.name||attrs.property||"").toLowerCase();
   if(["datepublished","uploaddate","publish_date","article:published_time"].includes(key)&&attrs.content){
    publishedAt=attrs.content;publishedAtSource="YouTube 影片頁面（Meta）";break;
   }
  }
  if(publishedAt)break;
 }
 if(!publishedAt&&feed?.ok){
  const xml=await feed.text();
  const entry=xml.match(/<entry>[\s\S]*?<\/entry>/i)?.[0]||xml;
  const feedId=entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
  const published=entry.match(/<published>([^<]+)<\/published>/)?.[1];
  if(published&&(!feedId||feedId===id)){publishedAt=published;publishedAtSource="YouTube RSS";}
 }
 if(publishedAt){
  const datePart=String(publishedAt).match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if(datePart)publishedAt=datePart;
  else {const d=new Date(publishedAt);publishedAt=!Number.isNaN(d.getTime())?d.toISOString().slice(0,10):null;}
 }
 return{videoId:id,url:canonical,title:oe.title||player?.videoDetails?.title||"YouTube "+id,author:oe.author_name||"",publishedAt,publishedAtSource,player};
}
function parseJson3(x){return(x.events||[]).flatMap(e=>{const text=(e.segs||[]).map(s=>s.utf8||"").join("").replace(/\n/g," ").trim();return text?[{start:(e.tStartMs||0)/1000,text}]:[]})}
function decode(s){return s.replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">")}
function parseXml(s){const a=[],re=/<text\b([^>]*)>([\s\S]*?)<\/text>/g;let m;while((m=re.exec(s))){const t=decode(m[2].replace(/<[^>]+>/g,"")).trim(),n=Number((m[1].match(/start="([^"]+)"/)||[])[1]||0);if(t)a.push({start:n,text:t})}return a}
async function captions(v,lang){const tracks=v.player?.captions?.playerCaptionsTracklistRenderer?.captionTracks||[];if(!tracks.length)throw Error("找不到公開字幕軌，或 YouTube 限制了雲端讀取。可貼上 YouTube Gemini 逐字稿。");const track=tracks.find(t=>t.languageCode===lang)||tracks.find(t=>(t.languageCode||"").startsWith(lang))||tracks[0];const u=new URL(track.baseUrl);u.searchParams.set("fmt","json3");const r=await fetch(u);if(!r.ok)throw Error("YouTube 字幕端點暫時無法讀取。");const raw=await r.text();let segments=[];try{segments=parseJson3(JSON.parse(raw))}catch{segments=parseXml(raw)}if(!segments.length)throw Error("字幕軌內容為空。");return{language:track.languageCode||"unknown",isAutoGenerated:track.kind==="asr",segments,text:segments.map(x=>{const m=Math.floor(x.start/60),s=String(Math.floor(x.start%60)).padStart(2,"0");return"("+m+":"+s+") "+x.text}).join("\n")}}
async function notion(env,path,body){const r=await fetch("https://api.notion.com/v1"+path,{method:body?"POST":"GET",headers:{"Authorization":"Bearer "+env.NOTION_TOKEN,"Notion-Version":NOTION_VERSION,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||"Notion API "+r.status);return d}
async function duplicate(env,id,url){
 if(id){
  const d=await notion(env,"/data_sources/"+DATA_SOURCE_ID+"/query",{filter:{property:"YouTube 影片 ID",rich_text:{equals:id}},page_size:1});
  if(d.results?.[0])return d.results[0];
 }
 if(url){
  const d=await notion(env,"/data_sources/"+DATA_SOURCE_ID+"/query",{filter:{property:"影片連結",url:{equals:url}},page_size:1});
  return d.results?.[0]||null;
 }
 return null;
}
async function recordId(url,id){
 if(id)return id;
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(url).trim()));
 return "src-"+Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,"0")).join("").slice(0,32);
}
function youtubeIdOrEmpty(url){try{return videoId(url)}catch{return""}}
function htmlEscape(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function shareHtml(item,endpoint){
 const done=item.status==="imported";
 const safeTitle=htmlEscape(item.title||"Mason 英文學習紀錄");
 const safeUrl=htmlEscape(item.url||"");
 const safeTranscript=htmlEscape(item.transcript||"");
 const safeNotion=done?htmlEscape(item.notionUrl||""):"";
 return new Response(`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f6f8fb"><title>${safeTitle}｜Mason</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f6fa;color:#202938;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}.wrap{max-width:860px;margin:32px auto;padding:0 16px}.card{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:22px;margin:16px 0;box-shadow:0 4px 18px #17203308}h1{font-size:24px;line-height:1.3;margin:6px 0 10px}h2{font-size:18px;margin:0 0 12px}.muted{color:#697586;font-size:14px}.tag{font-size:12px;letter-spacing:.12em;color:#64748b}a{color:#2563eb;overflow-wrap:anywhere}textarea{width:100%;border:1px solid #d7dee8;border-radius:12px;padding:14px;font:14px/1.65 ui-monospace,monospace;resize:vertical;background:#fbfcfe;color:#263244}#transcript{min-height:260px}#analysis{min-height:300px}button{border:0;border-radius:11px;padding:12px 17px;font-weight:650;cursor:pointer;background:#2563eb;color:white}button.secondary{background:#eaf0f8;color:#263244}button:disabled{opacity:.55;cursor:wait}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.status{padding:12px;border-radius:10px;background:#f2f5f9;color:#465366;white-space:pre-wrap}.success{background:#eaf8ef;color:#17663a}.error{background:#fff0f0;color:#a12626}.steps{padding-left:22px}.steps li{margin:5px 0}@media(max-width:560px){.card{padding:16px}.wrap{margin:18px auto}h1{font-size:21px}}
</style><body><main class="wrap"><div class="tag">MASON LEARNING HUB · SHARE & NOTION IMPORT</div><section class="card"><h1>${safeTitle}</h1><div class="muted">影片資訊 · Video ID：${htmlEscape(item.videoId||"")}</div><p><a href="${safeUrl}" target="_blank" rel="noopener">開啟 YouTube 影片</a></p><div class="row"><button class="secondary" id="copyPrompt">複製 ChatGPT 分析指令</button><span class="muted">同一個連結可讀取逐字稿，也可匯入 Notion</span></div></section><section class="card"><h2>01　英文逐字稿</h2><textarea id="transcript" readonly>${safeTranscript}</textarea><p class="muted">可複製逐字稿，或直接把本頁連結貼給 ChatGPT。</p></section><section class="card"><h2>02　ChatGPT 學習整理</h2><ol class="steps"><li>把本頁網址貼給一般 ChatGPT，請它讀取逐字稿並完成英語學習分析。</li><li>複製 ChatGPT 的完整整理結果。</li><li>回到本頁，貼在下方並按「匯入 Notion」。</li></ol>${done?`<div class="status success">這筆影片已經匯入 Notion。${safeNotion?`<br><a href="${safeNotion}" target="_blank" rel="noopener">開啟 Notion 學習紀錄</a>`:""}</div>`:`<form id="importForm"><label for="analysis"><strong>貼上 ChatGPT 完整分析結果（支援 Markdown）</strong></label><textarea id="analysis" required placeholder="把 ChatGPT 的完整英文學習整理貼在這裡……"></textarea><div class="row" style="margin-top:12px"><button id="submitBtn" type="submit">匯入 Notion</button><span class="muted">匯入後會保留影片資訊、原始逐字稿與學習整理</span></div></form>`}<div id="status" class="status" style="margin-top:12px" ${done?'':'hidden'}></div></section><footer class="muted">分享連結請妥善保管；持有連結的人可以讀取逐字稿並提交匯入。</footer></main><script>
const endpoint=location.href;const promptText="請讀取這個 Mason 分享連結，根據影片英文逐字稿整理：1.重要單字與片語（含中譯、語境、例句）2.實用句型與文法3.自然度、語域與更道地的說法4.必要的逐字稿修正（不要擅自改寫原文）5.英檢中高級口說與寫作可用表達6.複習重點。請使用繁體中文說明，英文例句保留英文。完成後請輸出完整、可直接貼回 Mason 的 Markdown。分享連結："+endpoint;
document.getElementById("copyPrompt").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(promptText);document.getElementById("copyPrompt").textContent="已複製指令"}catch{alert("瀏覽器不允許自動複製，請直接複製網址貼給 ChatGPT。")}});
const form=document.getElementById("importForm");if(form)form.addEventListener("submit",async e=>{e.preventDefault();const btn=document.getElementById("submitBtn"),status=document.getElementById("status"),analysis=document.getElementById("analysis").value.trim();if(!analysis)return;btn.disabled=true;btn.textContent="正在匯入…";status.hidden=false;status.className="status";status.textContent="正在寫入 Notion，請稍候…";try{const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({analysis})});const d=await r.json();if(!r.ok||!d.imported)throw new Error(d.error||"匯入失敗");status.className="status success";status.innerHTML="匯入成功！"+(d.notionUrl?'<br><a target="_blank" rel="noopener">開啟 Notion 學習紀錄</a>':"");const a=status.querySelector("a");if(a)a.href=d.notionUrl;btn.textContent="已匯入";}catch(err){status.className="status error";status.textContent="匯入失敗："+err.message;btn.disabled=false;btn.textContent="再試一次";}});
</script></body></html>`,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
const rt=s=>[{type:"text",text:{content:String(s).slice(0,1900)}}];
function blocks(title,content){const out=[{object:"block",type:"heading_2",heading_2:{rich_text:rt(title)}}];for(const raw of String(content||"").split(/\r?\n/)){const line=raw.trim();if(!line)continue;let type="paragraph",value=line;if(/^### /.test(line)){type="heading_3";value=line.slice(4)}else if(/^##? /.test(line)){type="heading_2";value=line.replace(/^##? /,"")}else if(/^[-*] /.test(line)){type="bulleted_list_item";value=line.slice(2)}else if(/^\d+[.)] /.test(line)){type="numbered_list_item";value=line.replace(/^\d+[.)] /,"")}for(let i=0;i<value.length;i+=1800)out.push({object:"block",type,[type]:{rich_text:rt(value.slice(i,i+1800))}})}return out}
async function appendBlocks(env,pageId,children){
 for(let i=0;i<children.length;i+=100){
  await notion(env,"/blocks/"+pageId+"/children",{children:children.slice(i,i+100)});
 }
}
async function save(env,b){
 const inputUrl=String(b.url||"").trim();
 if(!inputUrl)throw Error("教材連結不可空白");
 const parsedId=youtubeIdOrEmpty(inputUrl);
 const v=b.video|| (parsedId?await videoInfo(inputUrl):{videoId:"",url:inputUrl,title:b.title||"未命名教材",publishedAt:b.publishedAt||null,author:""});
 const id=v.videoId||parsedId||"";
 const canonical=v.url||inputUrl;
 const old=await duplicate(env,id,canonical);
 const sourceType=b.sourceType||"Mason";
 const sourceName=b.sourceName||"";
 const contentType=b.contentType|| (sourceType==="Podcast"?"Podcast":"影片");
 const title=b.title||v.title||"未命名教材";
 const sourceMeta="來源分類："+sourceType+"\n來源名稱："+(sourceName||"未填寫")+"\n教材形式："+contentType+"\n教材連結："+canonical+"\n來源 ID："+(id||"非 YouTube");
 const contentBlocks=[...blocks("教材來源",sourceMeta)];
 if(b.transcript)contentBlocks.push(...blocks("原始逐字稿／文章",b.transcript));
 if(b.analysis)contentBlocks.push(...blocks("Gemini 學習教材",b.analysis));
 if(old){
  await appendBlocks(env,old.id,contentBlocks);
  return{duplicate:true,url:old.url,id:old.id};
 }
 const props={
  "影片名稱":{title:rt(title)},
  "影片連結":{url:canonical},
  "學習狀態":{select:{name:"待學習"}},
  "學習日期":{date:{start:new Date().toISOString().slice(0,10)}},
  "來源分類":{select:{name:sourceType}},
  "來源名稱":{rich_text:sourceName?rt(sourceName):[]},
  "教材形式":{select:{name:contentType}},
  "內容狀態":{select:{name:b.analysis?"有內容":(b.transcript?"部分內容":"沒內容")}}
 };
 if(id)props["YouTube 影片 ID"]={rich_text:rt(id)};
 const page=await notion(env,"/pages",{parent:{type:"data_source_id",data_source_id:DATA_SOURCE_ID},properties:props,children:contentBlocks.slice(0,100)});
 if(contentBlocks.length>100)await appendBlocks(env,page.id,contentBlocks.slice(100));
 return{url:page.url,id:page.id};
}

function plainText(items){if(typeof items==="string")return items;return (items||[]).map(x=>x.plain_text||x.text?.content||"").join("")}
async function notionChildren(env,blockId,depth=0){
 if(depth>4)return [];
 let out=[],cursor=null;
 do{
  const path="/blocks/"+blockId+"/children?page_size=100"+(cursor?"&start_cursor="+encodeURIComponent(cursor):"");
  const d=await notion(env,path);
  for(const b of d.results||[]){
   const v=b[b.type]||{};
   const item={type:b.type,text:plainText(v.rich_text||v.title),checked:v.checked??null,url:v.url||v.external?.url||v.file?.url||null,language:v.language||null,cells:null,children:[]};
   if(b.type==="table_row")item.cells=(v.cells||[]).map(plainText);
   if(b.has_children)item.children=await notionChildren(env,b.id,depth+1);
   out.push(item);
  }
  cursor=d.has_more?d.next_cursor:null;
 }while(cursor);
 return out;
}
function notionProp(page,name,type){
 const p=page.properties?.[name];
 if(!p)return null;
 if(type==="title")return plainText(p.title);
 if(type==="select"||type==="status")return p[type]?.name||null;
 if(type==="date")return p.date?.start||null;
 if(type==="files")return (p.files||[]).map(x=>x.external?.url||x.file?.url||x.name).filter(Boolean);
 return null;
}
async function notionMaterials(env){
 let results=[],cursor=null;
 do{
  const d=await notion(env,"/data_sources/"+DATA_SOURCE_ID+"/query",{page_size:100,...(cursor?{start_cursor:cursor}:{})});
  results.push(...(d.results||[]));cursor=d.has_more?d.next_cursor:null;
 }while(cursor);
 return Promise.all(results.map(async page=>({
  id:page.id,url:page.url,
  number:page.properties?.["序號"]?.unique_id?.prefix&&page.properties?.["序號"]?.unique_id?.number?String(page.properties["序號"].unique_id.prefix)+"-"+page.properties["序號"].unique_id.number:(page.properties?.["序號"]?.number??""),
  title:notionProp(page,"影片名稱","title")||"未命名教材",
  channel:notionProp(page,"頻道","select"),
  category:notionProp(page,"分類","select"),
  learningStatus:notionProp(page,"學習狀態","status")||notionProp(page,"學習狀態","select"),
  contentStatus:notionProp(page,"內容狀態","select"),
  learningDate:notionProp(page,"學習日期","date"),
  releaseDate:notionProp(page,"影片發布日期","date"),
  reviewDate:notionProp(page,"最後一次複習日期","date"),
  links:notionProp(page,"影片連結","files")||[],
  blocks:await notionChildren(env,page.id)
 })));
}

export default{async fetch(req,env){if(req.method==="OPTIONS")return new Response(null,{headers:cors});const u=new URL(req.url);try{if((u.pathname==="/api/check"||u.pathname==="/api/save")&&(!env.APP_PASSWORD||req.headers.get("X-App-Password")!==env.APP_PASSWORD))return reply({error:"密碼錯誤或尚未設定 APP_PASSWORD"},401);if(u.pathname==="/api/health")return reply({ok:true,service:"mason-learning-hub"});

if(u.pathname==="/api/materials"&&req.method==="GET"){
 if(!env.NOTION_TOKEN)return reply({error:"尚未設定 Notion 連線"},503);
 if(!env.APP_PASSWORD||req.headers.get("X-App-Password")!==env.APP_PASSWORD)return reply({error:"請輸入網站管理密碼"},401);
 const items=await notionMaterials(env);
 items.sort((a,b)=>String(b.learningDate||"").localeCompare(String(a.learningDate||"")));
 return reply({count:items.length,items});
}

if(u.pathname==="/api/queue"&&req.method==="POST"){
 if(!env.APP_PASSWORD||req.headers.get("X-App-Password")!==env.APP_PASSWORD)return reply({error:"網站存取密碼錯誤或尚未設定"},401);
 if(!env.LESSONS)return reply({error:"待整理資料庫尚未綁定"},503);
 const b=await req.json();if(!b.url||(!b.transcript&&!b.analysis))return reply({error:"教材連結不可空白，且至少需要逐字稿或 Gemini 教材"},400);
 const parsedId=youtubeIdOrEmpty(b.url),v=b.video||(parsedId?await videoInfo(b.url):{videoId:"",url:b.url,title:b.title||"未命名教材",publishedAt:b.publishedAt||null,author:""});
 const id=await recordId(v.url||b.url,v.videoId||parsedId),key="lesson:"+id;
 const old=await env.LESSONS.get(key);if(old)return reply({duplicate:true,id,record:JSON.parse(old)},200);
 const item={id,videoId:v.videoId||parsedId||null,url:v.url||b.url,title:b.title||v.title||"未命名教材",sourceType:b.sourceType||"其他",sourceName:b.sourceName||"",contentType:b.contentType||(b.sourceType==="Podcast"?"Podcast":"影片"),publishedAt:b.publishedAt||v.publishedAt||null,author:v.author||"",transcript:b.transcript||"",analysis:b.analysis||"",status:"pending",createdAt:new Date().toISOString()};
 await env.LESSONS.put(key,JSON.stringify(item));return reply({saved:true,id,title:item.title,status:item.status},201)
}
const shareMatch=u.pathname.match(/^\/api\/share\/([a-f0-9]{64})$/);
if(shareMatch&&req.method==="GET"){
 if(!env.LESSONS)return reply({error:"待整理資料庫尚未綁定"},503);
 const ref=await env.LESSONS.get("share:"+shareMatch[1]);if(!ref)return reply({error:"分享連結不存在或已失效"},404);
 const meta=JSON.parse(ref),raw=await env.LESSONS.get("lesson:"+meta.videoId);if(!raw)return reply({error:"影片資料不存在"},404);
 const item=JSON.parse(raw);if((req.headers.get("Accept")||"").includes("text/html"))return shareHtml(item,u.origin+u.pathname);return reply({type:"mason-gpt-import",title:item.title,url:item.url,videoId:item.videoId,publishedAt:item.publishedAt,transcript:item.transcript,instructions:"請分析這部影片，整理英文學習紀錄（詞彙片語、句型、自然度與語域、逐字稿修正、英檢中高級口說寫作可用表達、複習重點）。請輸出完整 Markdown，讓使用者貼回本分享頁的匯入欄位。請勿改動或猜測影片逐字稿。",importEndpoint:u.origin+u.pathname,imported:item.status==="imported",notionUrl:item.notionUrl||null});
}
if(shareMatch&&req.method==="POST"){
 if(!env.LESSONS||!env.NOTION_TOKEN)return reply({error:"Notion 或 KV 尚未設定"},503);
 const ref=await env.LESSONS.get("share:"+shareMatch[1]);if(!ref)return reply({error:"分享連結不存在或已失效"},404);
 const meta=JSON.parse(ref),raw=await env.LESSONS.get("lesson:"+meta.videoId);if(!raw)return reply({error:"影片資料不存在"},404);
 const item=JSON.parse(raw);if(item.status==="imported")return reply({imported:true,duplicate:true,notionUrl:item.notionUrl||null});
 const b=await req.json();if(typeof b.analysis!=="string"||!b.analysis.trim())return reply({error:"analysis 不可空白"},400);
 const saved=await save(env,{url:item.url,video:{videoId:item.videoId,url:item.url,title:item.title,publishedAt:item.publishedAt,author:item.author},transcript:item.transcript,analysis:b.analysis});
 item.status="imported";item.notionUrl=saved.url;item.importedAt=new Date().toISOString();await env.LESSONS.put("lesson:"+meta.videoId,JSON.stringify(item));return reply({imported:true,notionUrl:saved.url,duplicate:!!saved.duplicate},201);
}
if(u.pathname==="/api/pending"&&req.method==="GET"){
 if(!env.LESSONS)return reply({error:"待整理資料庫尚未綁定"},503);
 const auth=req.headers.get("Authorization")||"";
 const bearer=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
 const legacy=u.searchParams.get("key")||"";
 if(!env.GPT_READ_KEY||!(bearer===env.GPT_READ_KEY||legacy===env.GPT_READ_KEY))return reply({error:"讀取金鑰錯誤，請確認 Cloudflare GPT_READ_KEY"},401);
 const listed=await env.LESSONS.list({prefix:"lesson:",limit:1000}),items=[];
 for(const k of listed.keys){const raw=await env.LESSONS.get(k.name);if(raw){try{const item=JSON.parse(raw);if(item.status==="pending")items.push(item)}catch{}}}
 items.sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
 return reply({count:items.length,items})
}if(u.pathname==="/api/library"&&req.method==="GET"){
 if(!env.LESSONS)return reply({error:"待整理資料庫尚未綁定"},503);
 if(!env.APP_PASSWORD||req.headers.get("X-App-Password")!==env.APP_PASSWORD)return reply({error:"網站管理密碼錯誤或尚未設定"},401);
 const listed=await env.LESSONS.list({prefix:"lesson:",limit:1000}),items=[];
 for(const k of listed.keys){const raw=await env.LESSONS.get(k.name);if(raw){try{const item=JSON.parse(raw);items.push(item)}catch{}}}
 items.sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
 return reply({count:items.length,items});
}
if(u.pathname==="/api/mark-imported"&&req.method==="POST"){
 if(!env.LESSONS)return reply({error:"待整理資料庫尚未綁定"},503);
 if(!env.APP_PASSWORD||req.headers.get("X-App-Password")!==env.APP_PASSWORD)return reply({error:"網站管理密碼錯誤或尚未設定"},401);
 const b=await req.json();if(!b.id||!b.notionUrl)return reply({error:"缺少教材 ID 或 Notion 連結"},400);
 const key="lesson:"+b.id,raw=await env.LESSONS.get(key);if(!raw)return reply({error:"找不到這筆教材紀錄"},404);
 const item=JSON.parse(raw);item.status="imported";item.notionUrl=b.notionUrl;item.importedAt=new Date().toISOString();
 await env.LESSONS.put(key,JSON.stringify(item));return reply({updated:true,id:b.id,status:item.status,notionUrl:item.notionUrl});
}
if(u.pathname==="/api/video"){const v=await videoInfo(u.searchParams.get("url")||"");delete v.player;return reply(v)}if(u.pathname==="/api/transcript"){const v=await videoInfo(u.searchParams.get("url")||""),t=await captions(v,u.searchParams.get("lang")||"en");return reply({...t,videoId:v.videoId})}if(u.pathname==="/api/check"){if(!env.NOTION_TOKEN)return reply({error:"尚未設定 NOTION_TOKEN"},503);const id=u.searchParams.get("videoId");const old=await duplicate(env,id);return reply({exists:!!old,url:old?.url||null})}if(u.pathname==="/api/save"&&req.method==="POST"){if(!env.NOTION_TOKEN)return reply({error:"尚未設定 NOTION_TOKEN"},503);const b=await req.json();if(!b.transcript||!b.analysis||!b.url)return reply({error:"連結、逐字稿與分析結果不可空白"},400);const r=await save(env,b);if(r.duplicate)return reply({error:"影片已收錄",url:r.url},409);return reply(r,201)}return reply({error:"Not found"},404)}catch(e){return reply({error:e.message||"Unknown error"},500)}}};