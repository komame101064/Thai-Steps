// 並べ替え練習（確認テストとは別）。日本語文を見て、バラバラのタイ語を順にタップして文を組み立てる。
// 問題は dist/reorder-items.js（scripts/build-reorder.cjs で例文と確認問題から作成）。練習の結果は学習記録に保存しない。
let build=null,buildSel=null;
const BUILD_LEVELS=[
 {id:1,name:'やさしい',desc:'2〜3語・余分な語1つ',min:2,max:3,extra:1},
 {id:2,name:'ふつう',desc:'3〜5語・余分な語1つ',min:3,max:5,extra:1},
 {id:3,name:'むずかしい',desc:'5〜7語・余分な語2つ・語を細かく分割',min:5,max:7,extra:2,fine:true},
 {id:4,name:'上級',desc:'7語以上・余分な語3つ・語を細かく分割',min:7,max:99,extra:3,fine:true}];
function reorderReady(){return typeof REORDER_ITEMS!=='undefined'}
function withReorder(fn){if(reorderReady())return fn();if(typeof loadLazyScript==='function')loadLazyScript('reorder-items.js').then(()=>reorderReady()?fn():toast('問題を読み込めませんでした。通信状態を確認してください。'))}
function reorderItems(id){return reorderReady()?REORDER_ITEMS[id]||[]:[]}
function lessonTestCount(id){return reorderReady()?Math.min(10,reorderItems(id).length):10}
function buildLevel(id){return BUILD_LEVELS.find(l=>l.id===id)||null}
function buildToks(it,lv){const t=(lv&&lv.fine&&it.f)?it.f:it.t;return t.map(x=>({th:x[0],ro:x[1],mean:x[2]||''}))}
function buildFits(it,lv){const n=buildToks(it,lv).length;return n>=lv.min&&n<=lv.max}
// 余分な語：同じ課の別の文から（文法的に紛らわしい語）→足りなければ他の課から
function buildDistractors(id,tokens,count){if(!count)return [];const have=new Set(tokens.map(t=>t.th)),pick=[],add=list=>{for(const it of shuffle(list))for(const x of shuffle(it.t)){if(pick.length>=count)return;if(!have.has(x[0])&&!pick.some(p=>p.th===x[0])&&x[0].length<=12)pick.push({th:x[0],ro:x[1],mean:x[2]||''})}};
 add(reorderItems(id));if(pick.length<count){const ids=Object.keys(REORDER_ITEMS);for(let n=0;n<4&&pick.length<count;n++)add(reorderItems(ids[Math.floor(Math.random()*ids.length)]))}return pick}
function buildChips(tokens,extra){let chips=shuffle([...tokens.map((t,k)=>({...t,k})),...extra.map(t=>({...t,k:-1}))]);
 if(tokens.length>1&&chips.filter(c=>c.k>=0).every((c,n,a)=>n===0||a[n-1].k<c.k))chips.reverse();// 正解の並びのままにしない
 return chips}
function buildMake(key,lv){if(String(key).startsWith('u:'))return buildMakeCustom(key,lv);const x=quizItem(key),it=reorderItems(x.id)[x.k];if(!it)return null;const l=lessons[x.id-1],tokens=buildToks(it,lv),extra=buildDistractors(x.id,tokens,lv?lv.extra:(tokens.length>=5?2:1));
 return {key:x.key,id:x.id,k:x.k,l,it,tokens,chips:buildChips(tokens,extra),picked:[],checked:null}}
function startReorder(keys,origin,opts={}){withReorder(()=>{const lv=opts.level?buildLevel(opts.level):null,items=keys.map(k=>buildMake(k,lv)).filter(Boolean);if(!items.length){toast('この条件の問題がありません。');return}
 build={origin,title:opts.title||'',lessonId:opts.lessonId||null,level:lv,keys:items.map(q=>q.key),items,k:0,results:[],hint:false,opts};quiz=null;view='build';render();window.scrollTo(0,0)})}
// 課の確認テスト：その課の問題から10問。全問正解で履修済み。
function startLessonTest(id){withReorder(()=>{const keys=shuffle(reorderItems(id).map((_,k)=>`${id}:${k}`)).slice(0,10);startReorder(keys,'lesson',{lessonId:id,title:`${displayNumber(id)} ${lessons[id-1].title}`})})}
// 入力した文で練習：利用者が入力したタイ語の文を辞書の語に分けて並べ替え問題にする（1行1文、「/」の後に日本語訳）。
let buildCustom=[],buildPreview=null;
function customLex(){if(customLex.m&&customLex.b===bank)return customLex.m;const m=new Map();let max=1;
 if(typeof segEntries==='function'&&bank.length)for(const [th,x] of segEntries())m.set(th,{ro:x.ro,mean:x.meanings?.[0]?.ja||'',c:isPhrase(x)||/定型|表現|フレーズ/.test(x.pos||'')&&/\s/.test(x.ro)?10:1});// 決まり文句は語に分けられるなら分ける
 for(const k in vocabulary)if(!m.has(k)){const v=vocabulary[k];m.set(k,{ro:v.ro.replace(/ŋ/g,'ng'),mean:v.meaning||'',c:1})}
 for(const k of m.keys())if(k.length>max)max=k.length;customLex.m=m;customLex.b=bank;customLex.max=max;return m}
// 最少の語数で全体を覆う分け方（辞書にない部分は1つにまとめて「未登録」とする）
function customSegment(th){const m=customLex(),max=customLex.max,n=th.length,cost=new Array(n+1).fill(Infinity),back=new Array(n+1).fill(null);cost[0]=0;
 for(let i=0;i<n;i++){if(cost[i]===Infinity)continue;const ch=th[i],relax=(e,c,tok)=>{if(cost[i]+c<cost[e]){cost[e]=cost[i]+c;back[e]={i,tok}}};
  if(/[\s.,!?…"“”'‘’()「」:;。、？！]/.test(ch)){relax(i+1,0,null);continue}
  if(ch==='ๆ'){relax(i+1,0,{kind:'rep'});continue}
  if(/[0-9A-Za-z๐-๙]/.test(ch)){let e=i;while(e<n&&/[0-9A-Za-z๐-๙.,:]/.test(th[e]))e++;relax(e,1,{kind:'other'});continue}
  for(let L=1;L<=max&&i+L<=n;L++){const x=m.get(th.slice(i,i+L));if(x)relax(i+L,x.c,{kind:'word',x})}
  relax(i+1,8,{kind:'unk'})}
 const raw=[];for(let e=n;e>0;){const b=back[e];if(!b)return null;if(b.tok)raw.push({...b.tok,th:th.slice(b.i,e)});e=b.i}raw.reverse();
 const out=[];for(const t of raw){const last=out[out.length-1];
  if(t.kind==='rep'&&last){last.th+='ๆ';last.ro=last.ro?last.ro+' '+last.ro.split(' ').pop():'';continue}
  if(t.kind==='unk'&&last&&last.unk){last.th+=t.th;continue}
  out.push(t.kind==='word'?{th:t.th,ro:t.x.ro,mean:t.x.mean}:t.kind==='other'?{th:t.th,ro:t.th,mean:''}:{th:t.th,ro:'',mean:'',unk:true})}
 for(const t of out)if(t.unk){const r=typeof romanizeThai==='function'?romanizeThai(t.th):'';t.ro=r&&!r.includes('□')?r:''}
 return out}
// 1行＝1文。日本語だけの行はタイ語の文を用意する。タイ語を含む行はそのまま使う（「/」で日本語訳を添えられる）。
function parseCustom(text){const thai=x=>/[฀-๿]/.test(x);return String(text||'').split(/\n+/).map(l=>l.trim()).filter(Boolean).slice(0,30).map(l=>{const parts=l.split(/\s*[\/／\t]\s*/).map(x=>x.trim()).filter(Boolean);return {th:parts.find(thai)||'',ja:parts.find(x=>!thai(x))||''}}).filter(x=>x.th||x.ja)}
const bqJaKey=s=>String(s||'').normalize('NFKC').replace(/[\s。、，．,.!?！？「」『』()（）・…〜~"'”“]/g,'');
function jaBigrams(s){const k=bqJaKey(s),out=new Set();for(let i=0;i<k.length-1;i++)out.add(k.slice(i,i+2));if(k.length===1)out.add(k);return out}
function jaSim(a,b){if(!a.size||!b.size)return 0;let n=0;for(const x of a)if(b.has(x))n++;return 2*n/(a.size+b.size)}
// アプリ内の日本語訳付きのタイ語文（文法の例文・確認問題・単語の用例）
let customCorpusCache=null;
function customCorpus(){const tag=(reorderReady()?1:0)+(typeof senseExamples!=='undefined'&&senseExamples?2:0);if(customCorpusCache&&customCorpusCache.tag===tag)return customCorpusCache.list;const list=[],seen=new Set(),add=(ja,th,ro)=>{th=String(th||'').replace(/\s+/g,'');if(!ja||!th||!ro||seen.has(th)||/[＿_]/.test(th))return;seen.add(th);list.push({ja,th,ro,key:bqJaKey(ja),bg:null})};
 if(reorderReady())for(const id in REORDER_ITEMS)for(const it of REORDER_ITEMS[id])add(it.ja,it.th,it.ro);
 for(const l of lessons)for(const e of l.examples)add(e.ja,e.th,e.ro);
 if(tag&2)for(const e of Object.values(senseExamples))if(e.checked!==false)add(e.ja,e.th,e.ro);
 customCorpusCache={tag,list};return list}
function corpusMatches(ja){const key=bqJaKey(ja),bg=jaBigrams(ja),out=[];for(const e of customCorpus()){if(e.key===key){out.push({...e,score:1});continue}if(!e.bg)e.bg=jaBigrams(e.ja);const sc=jaSim(bg,e.bg);if(sc>=0.75)out.push({...e,score:sc})}return out.sort((x,y)=>y.score-x.score).slice(0,2)}
// 例文にない文は機械翻訳（Google 翻訳）で作る。結果は端末に保存し、同じ文を何度も送らない。
async function machineThai(ja){const cache=state.buildMT||(state.buildMT={});if(cache[ja])return cache[ja];
 const r=await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=th&dt=t&q='+encodeURIComponent(ja));if(!r.ok)throw Error('mt');const d=await r.json(),th=((d&&d[0])||[]).map(x=>(x&&x[0])||'').join('').trim();if(!/[฀-๿]/.test(th))throw Error('mt');
 const ks=Object.keys(cache);if(ks.length>=200)delete cache[ks[0]];cache[ja]=th;save();return th}
// 行ごとの候補：例文と同じ文→その例文／なければ機械翻訳。近い例文もほかの候補として出す。
async function customResolve(text){const rows=[];let mtError=false;for(const x of parseCustom(text)){
  if(x.th){rows.push({ja:x.ja,opts:[{th:x.th.replace(/\s+/g,''),raw:x.th,ja:x.ja,src:'input'}],pick:0});continue}
  const m=corpusMatches(x.ja),exact=m.filter(e=>e.score===1),opts=exact.slice(0,1).map(e=>({th:e.th,ro:e.ro,ja:e.ja,src:'example'}));
  if(!exact.length){try{const th=await machineThai(x.ja);opts.push({th:th.replace(/\s+/g,''),raw:th,ja:x.ja,src:'mt'})}catch{mtError=true}}
  if(!exact.length)for(const e of m)if(!opts.some(o=>o.th===e.th))opts.push({th:e.th,ro:e.ro,ja:e.ja,src:'near'});
  const saved=(state.buildPick||{})[x.ja],k=opts.findIndex(o=>o.th===saved);rows.push({ja:x.ja,opts,pick:k>=0?k:0})}
 rows.mtError=mtError;return rows}
// 語に分ける。文の読みがあるときは、その読みを語ごとに割り当てる（音節数が合う場合）。
function customRefine(t){const m=customLex(),out=[];for(const x of t){const n=x.ro?x.ro.split(/\s+/).length:0;let parts=null;
  if(n>=2&&!x.unk){const keep=m.get(x.th);m.delete(x.th);try{const s=customSegment(x.th);if(s&&s.length>=2&&s.every(y=>!y.unk))parts=s}finally{if(keep)m.set(x.th,keep)}}
  parts?out.push(...parts):out.push(x)}return out}
// 自作の文は難易度を選ばない：短い文だけ細かく分ける
function customTokens(o,lv=buildLevel(2)){let t=customSegment(o.raw||o.th);if(!t)return null;if(lv&&(lv.fine||t.length<lv.min))t=customRefine(t);if(o.ro){const S=o.ro.replace(/[.,!?…"“”'‘’()「」:;]/g,' ').split(/\s+/).filter(Boolean),c=t.map(x=>x.ro?x.ro.split(/\s+/).length:0);if(c.every(Boolean)&&c.reduce((p,q)=>p+q,0)===S.length){let j=0;t.forEach((x,i)=>{x.ro=S.slice(j,j+c[i]).join(' ');j+=c[i]})}}return t}
function customItemsFromRows(rows){const items=[],skipped=[];for(const r of rows){const o=r.opts[r.pick],t=o&&customTokens(o);if(!t||t.length<2){skipped.push(r.ja||(o&&o.th)||'');continue}
 items.push({ja:o.ja||r.ja,th:o.th,ro:o.ro||t.map(y=>y.ro).filter(Boolean).join(' '),t:t.map(y=>[y.th,y.ro,y.mean]),unk:t.filter(y=>y.unk).map(y=>y.th),src:o.src})}return {items,skipped}}
function customDistractors(tokens,count){if(!count)return [];const have=new Set(tokens.map(t=>t.th)),pick=[],add=list=>{for(const x of shuffle(list)){if(pick.length>=count)return;if(x[0]&&!have.has(x[0])&&!pick.some(p=>p.th===x[0])&&x[0].length<=12)pick.push({th:x[0],ro:x[1],mean:x[2]||''})}};
 add(buildCustom.flatMap(it=>it.t));if(pick.length<count&&reorderReady()){const ids=Object.keys(REORDER_ITEMS);for(let n=0;n<6&&pick.length<count;n++)add(reorderItems(ids[Math.floor(Math.random()*ids.length)]).flatMap(it=>it.t))}return pick}
function buildMakeCustom(key,lv){const it=buildCustom[Number(String(key).slice(2))];if(!it)return null;const tokens=it.t.map(x=>({th:x[0],ro:x[1],mean:x[2]||''}));
 return {key,id:null,k:null,l:null,it,tokens,chips:buildChips(tokens,customDistractors(tokens,lv?lv.extra:1)),picked:[],checked:null}}
let customBusy=false;
function withCustomData(fn){const jobs=[];if(typeof bankStatus!=='undefined'&&bankStatus!=='ready'&&typeof loadWordBank==='function')jobs.push(loadWordBank());if(typeof senseExamplesStatus!=='undefined'&&senseExamplesStatus!=='ready'&&typeof loadSenseExamples==='function')jobs.push(loadSenseExamples());if(!reorderReady()&&typeof loadLazyScript==='function')jobs.push(loadLazyScript('reorder-items.js').catch(()=>{}));return Promise.all(jobs).then(fn)}
function customText(){const el=typeof document!=='undefined'&&document.getElementById&&document.getElementById('bq-custom');if(el){state.buildCustomText=el.value;save()}return state.buildCustomText||''}
async function buildMakeThai(){const text=customText();if(!parseCustom(text).length){toast('日本語の文を入力してください。');return}
 customBusy=true;render();try{await withCustomData(async()=>{const rows=await customResolve(text);buildPreview={text,rows};if(rows.mtError)toast('タイ語にできない文がありました。通信状態を確認してください。')})}finally{customBusy=false;render()}}
async function startCustomBuild(){const text=customText();if(!buildPreview||buildPreview.text!==text){await buildMakeThai();if(!buildPreview||buildPreview.text!==text)return}
 const r=customItemsFromRows(buildPreview.rows);if(!r.items.length){toast('練習できる文がありません。もう少し長い文を入力してください。');return}
 buildCustom=r.items;startReorder(shuffle(r.items.map((_,k)=>'u:'+k)),'custom',{title:'入力した文'});buildListenAuto();if(r.skipped.length)toast(`${r.skipped.length}文は短すぎるため除きました。`)}
function customSetupView(){return `<div class="bq-sec bq-custom"><div class="bq-sec-h"><h2>練習する文</h2><span>日本語で1行に1文</span></div>
 <textarea id="bq-custom" class="field bq-text" rows="4" placeholder="私はチャーハンが好きです&#10;明日、友だちと海に行きます" oninput="state.buildCustomText=this.value;save()">${esc(state.buildCustomText||'')}</textarea>
 <p class="bq-help">アプリの例文に同じ文があればその訳を使い、なければ Google 翻訳でタイ語にします（入力した日本語が Google に送られます）。機械翻訳は確認されていない訳です。タイ語を直接入力することもできます。</p>
 <button class="btn bq-custom-start" onclick="startCustomBuild()" ${customBusy?'disabled':''}>${customBusy?'タイ語を準備中…':'この文で練習 →'}</button></div>${savedSetupView()}`}
// 文に対応する文法の課：文を細かい語に分け、各課の目印になる語・語の並びで判定する（語単位なので ได้ยิน の ได้ などは拾わない）。
const GRAMMAR_HINTS=[
 [4,/ คือ | เป็น (?!((ครับ|ค่ะ|คะ|นะ|ไหม|มั้ย) )*$)/],[5,/ มี | อยู่ /,/ กำลัง /],[6,/ ไม่ |ไม่มี|ไม่ใช่/,/ ไม่ (ว่า|เพียง) | (ไม่ว่า|ไม่เพียงแต่) /],[7,/ (ไหม|มั้ย) /,/ ใช่ (ไหม|มั้ย) | ใช่ไหม /],
 [8,/ (อะไร|ไหน|เมื่อไร|เมื่อไหร่|ไร|ไหร่|ใคร|ทำไม|อย่างไร|ยังไง|เท่าไร|เท่าไหร่|กี่) /,/ อย่าง ?ไร ?ก็ ?ตาม /],[9,/ หรือ | ใช่ (ไหม|มั้ย) | ใช่ไหม | หรือเปล่า /],
 [10,/ กี่ \S+ | ([0-9๐-๙]+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|ยี่สิบ|ร้อย|พัน) (คน|ตัว|อัน|ใบ|เล่ม|คัน|ขวด|แก้ว|จาน|ชาม|ชิ้น|หลัง|ห้อง|ครั้ง|ลูก|เครื่อง|คู่|ชุด|แผ่น|เม็ด|ต้น|ดอก|วัน|ปี|เดือน|ชั่วโมง|นาที|บาท|คืน|อาทิตย์) /],
 [11,/ จะ /,/ (น่า|อาจ|ใกล้|ที่) จะ | (น่าจะ|อาจจะ|ใกล้จะ|เพื่อที่จะ|แม้จะ) |แม้ จะ /],[12,/ กำลัง /],[13,/ แล้ว /],[14,/ ยัง /,/ แต่ ยัง /],[15,/ เคย /],[16,/ อยาก /],
 [17,/ ได้ | เป็น ((ครับ|ค่ะ|คะ|นะ|ไหม|มั้ย) )*$/,/ ได้ (ยิน|รับ) /],[18,/ (ต้อง|ควร) /],[19,/ (ช่วย|หน่อย) /],[20,/ ลอง | ก่อน /,/(^|¦) ก่อน | ก่อน ที่ /],
 [21,/ (กว่า|ที่ สุด|ที่สุด) /,/ยิ่ง ?ไป ?กว่า ?นั้น/],[22,/ (เพราะ|ก็ เลย|ก็เลย) /],[23,/ ถ้า /],[25,/ ว่า /,/ (ไม่|แม้) ว่า | (ไม่ว่า|แม้ว่า) /],[26,/ ให้ /,/ (ทำ|ขอ) ให้ | (ทำให้|ขอให้) /],[27,/ (ทำ ให้|ทำให้) /],
 [28,/ (น่า จะ|น่าจะ|อาจ|อาจจะ) /],[29,/ ถูก \S+ /,/ ถูก (ครับ|ค่ะ|มาก|จัง|นะ|ดี|ต้อง|กว่า) /],[30,/ (นะ|สิ|ซิ|เหรอ|หรอ|ล่ะ|จ้ะ|จ้า) /],
 [31,/ ของ /,/ (ซื้อ|เก็บ) ของ | ของ (ขวัญ|หวาน|กิน|ฝาก) /],[32,/ ขอ /,/ ขอ (ให้|โทษ) /],[33,/ (เพิ่ง|ใกล้ จะ|ใกล้จะ) /],[34,/ (อย่า|ห้าม) /],
 [35,/ แต่ | ถึง [^¦]*ก็ /,/ (แต่ ยัง|เพียง แต่) /],[36,/ (ขึ้น|ลง) /],[37,/ เพื่อ /],[38,/ (เมื่อ|ตอน|ตอนที่|หลังจาก|หลัง จาก|ก่อนที่|ก่อน ที่) |(^|¦) ก่อน /,/ เมื่อ (วาน|ไร|ไหร่|กี้|คืน|เช้า) | ตอน ?(นี้|เช้า|เย็น|บ่าย|ค่ำ|กลางวัน|กลางคืน|ดึก) | ตอนนี้ /],
 [39,/ (จึง|ดัง นั้น|ดังนั้น) /],[40,/ (แม้|แม้ว่า|แม้จะ|ทั้งที่|ทั้ง ที่|อย่างไรก็ตาม|อย่าง ไร ก็ ตาม) /],[41,/ (ซึ่ง|โดย) /],[42,/ ยิ่ง [^¦]*ยิ่ง |ยิ่ง ?ไป ?กว่า ?นั้น/],[43,/ (ไม่ ว่า|ไม่ว่า) /],[44,/ (การ|ความ) /,/การ ?บ้าน/],[45,/ ไว้ /],
 [46,/ (กรุณา|โปรด|ขอ ให้|ขอให้|เชิญ|ขอเชิญ) /],[47,/ (ไม่ เพียง|ไม่เพียงแต่|แต่ ยัง|แต่ยัง|นอกจาก|นอก จาก) |ทั้ง [^¦]*และ /]];
function grammarLessonsFor(th){const t=customSegment(String(th||''));if(!t)return [];const f1=customRefine(t),f2=customRefine(f1),S=[t,f1,f2].map(v=>' '+v.map(x=>x.th).join(' ')+' ').join('¦'),ids=[];// 粗い分け方と細かい分け方の両方で照合
 for(const [id,inc,exc] of GRAMMAR_HINTS)if(lessons[id-1]&&inc.test(S)&&!(exc&&exc.test(S)))ids.push(id);
 if(!ids.length)ids.push(1);const pos=new Map(orderedLessons.map((l,i)=>[l.id,i]));return ids.sort((a,b)=>pos.get(a)-pos.get(b)).slice(0,5)}
function grammarChips(th){return `<div class="bq-gram"><span class="bq-gram-h">この文の文法</span>${grammarLessonsFor(th).map(id=>`<button class="bq-gram-c" onclick="openLesson(${id})"><b>${esc(displayNumber(id))}</b>${esc(lessons[id-1].title)}</button>`).join('')}</div>`}
// 保存した文（学習記録と同じ保存先。設定の書き出しにも入る）
function savedList(){return Array.isArray(state.buildSaved)?state.buildSaved:(state.buildSaved=[])}
function isSaved(th){return savedList().some(x=>x.th===th)}
function saveSentence(it){const list=savedList();if(!it||isSaved(it.th))return false;list.unshift({ja:it.ja||'',th:it.th,ro:it.ro||'',t:it.t,src:it.src||'',at:Date.now()});if(list.length>500)list.length=500;save();return true}
function toggleSaveCur(){const q=buildCur(),list=savedList(),k=list.findIndex(x=>x.th===q.it.th);if(k>=0){list.splice(k,1);save();toast('保存を解除しました')}else{saveSentence(q.it);toast('保存しました')}renderBuild()}
function saveAllCustom(){let n=0;for(const q of build.items)if(saveSentence(q.it))n++;toast(n?`${n}文を保存しました`:'すべて保存済みです');renderBuild()}
function removeSaved(i){savedList().splice(i,1);save();render()}
function startSavedBuild(){const list=savedList();if(!list.length)return;buildCustom=list.map(x=>({ja:x.ja,th:x.th,ro:x.ro,t:x.t,unk:[],src:x.src}));withReorder(()=>{startReorder(shuffle(buildCustom.map((_,k)=>'u:'+k)).slice(0,state.buildCount||10),'custom',{title:'保存した文'});buildListenAuto()})}
function savedSetupView(){const list=savedList();if(!list.length)return '';
 return `<div class="bq-sec bq-saved"><div class="bq-sec-h"><h2>保存した文</h2><span>${list.length}文</span></div>
 <div class="bq-saved-list">${list.map((x,i)=>`<div class="bq-saved-row"><div class="bq-saved-main"><div class="bq-saved-ja">${esc(x.ja||'')}</div><div class="bq-saved-th"><span lang="th">${esc(x.th)}</span><button class="speak is-icon" onclick="speakThaiText(${esc(JSON.stringify(x.th))})" aria-label="文を再生" title="文を再生">${icon('audio')}</button></div><div class="bq-saved-ro">${esc(x.ro)}${x.src==='mt'?' <span class="bq-src is-mt">機械翻訳・未確認</span>':''}</div>${grammarChips(x.th)}</div><button class="textbtn bq-saved-del" onclick="removeSaved(${i})" aria-label="削除">削除</button></div>`).join('')}</div>
 <button class="btn bq-custom-start" onclick="startSavedBuild()">保存した文で練習 →</button></div>`}
// 範囲・難易度を選ぶ画面
function openBuildSetup(){build=null;quiz=null;view='build';render();window.scrollTo(0,0);withReorder(()=>{if(view==='build'&&!build)render()})}
function buildSelected(){if(!buildSel){const saved=Array.isArray(state.buildRange)?state.buildRange.filter(id=>lessons[id-1]):[];buildSel=new Set(saved.length?saved:(state.done.length?state.done:orderedLessons.slice(0,6).map(l=>l.id)))}return buildSel}
function buildToggleLesson(id){const s=buildSelected();s.has(id)?s.delete(id):s.add(id);buildSaveSel()}
function buildToggleChapter(m){const s=buildSelected(),ids=lessons.filter(l=>l.m===m).map(l=>l.id),all=ids.every(id=>s.has(id));ids.forEach(id=>all?s.delete(id):s.add(id));buildSaveSel()}
function buildSetAll(mode){const s=buildSelected();s.clear();(mode==='done'?state.done:mode==='all'?lessons.map(l=>l.id):[]).forEach(id=>s.add(id));buildSaveSel()}
function buildSaveSel(){state.buildRange=[...buildSelected()];save();render()}
function buildCandidates(lv){const out=[];for(const id of buildSelected())reorderItems(id).forEach((it,k)=>{if(buildFits(it,lv))out.push(`${id}:${k}`)});return out}
function startFreeBuild(){withReorder(()=>{const lv=buildLevel(state.buildLevel||2),c=buildCandidates(lv);if(!c.length){toast('この範囲と難易度に合う問題がありません。範囲を広げるか難易度を変えてください。');return}startReorder(shuffle(c).slice(0,state.buildCount||10),'free',{level:lv.id,title:'並べ替え練習'})})}
function buildSetupView(){const src=state.buildSrc==='custom'?'custom':'lessons',sel=buildSelected(),ready=reorderReady(),lv=buildLevel(state.buildLevel||2),avail=ready?buildCandidates(lv).length:0;
 const chapters=modules.map((m,i)=>{const ls=lessons.filter(l=>l.m===i),n=ls.filter(l=>sel.has(l.id)).length;return `<details class="bq-ch"${n&&n<ls.length?' open':''}><summary><label onclick="event.stopPropagation()"><input type="checkbox" ${n===ls.length?'checked':''} onchange="buildToggleChapter(${i})"> ${i+1}. ${esc(m.name)}</label><span>${n}/${ls.length}</span></summary><div class="bq-ls">${ls.map(l=>`<label><input type="checkbox" ${sel.has(l.id)?'checked':''} onchange="buildToggleLesson(${l.id})"><span class="bq-ln">${displayNumber(l.id)}</span>${esc(l.title)}${state.done.includes(l.id)?'<em>✓</em>':''}</label>`).join('')}</div></details>`}).join('');
 return `<button class="textbtn back" onclick="go('course')">← 文法に戻る</button><section class="bq bq-setup"><h1>並べ替え練習</h1>
 <div class="bq-tabs" role="tablist">${[['lessons','課の例文から'],['custom','自分の文で']].map(([v,t])=>`<button role="tab" aria-selected="${src===v}" class="${src===v?'is-on':''}" onclick="state.buildSrc='${v}';save();render()">${t}</button>`).join('')}</div>
 ${src==='custom'?'':`<div class="bq-sec"><div class="bq-sec-h"><h2>難易度</h2></div><div class="bq-levels">${BUILD_LEVELS.map(x=>`<button class="bq-lv${x.id===lv.id?' is-on':''}" aria-pressed="${x.id===lv.id}" onclick="state.buildLevel=${x.id};save();render()"><b>${'★'.repeat(x.id)}<span>${'☆'.repeat(4-x.id)}</span> ${x.name}</b><small>${x.desc}</small></button>`).join('')}</div></div>`}
 ${src==='custom'?customSetupView():`<div class="bq-sec"><div class="bq-sec-h"><h2>出題範囲</h2><span>${sel.size}課を選択中</span></div><div class="bq-quick"><button onclick="buildSetAll('done')" ${state.done.length?'':'disabled'}>履修済みの課（${state.done.length}）</button><button onclick="buildSetAll('all')">すべての課</button><button onclick="buildSetAll('none')">選択を解除</button></div><div class="bq-chs">${chapters}</div></div>
 <div class="bq-sec bq-start"><label>問題数 <select class="field" onchange="state.buildCount=Number(this.value);save()">${[5,10,20].map(n=>`<option value="${n}" ${(state.buildCount||10)===n?'selected':''}>${n}問</option>`).join('')}</select></label><span class="bq-avail">${ready?(avail?`この条件で出せる文：${avail}`:'この範囲にはこの難易度の文がありません。範囲を広げてください'):'問題を読み込んでいます…'}</span><button class="btn" onclick="startFreeBuild()" ${ready&&avail?'':'disabled'}>はじめる →</button></div>`}
 </section>`}
function buildCur(){return build.items[build.k]}
function buildPick(n){const q=buildCur();if(q.checked!==null||q.picked.includes(n))return;q.picked.push(n);if(state.buildSound!==false)speakThaiText(q.chips[n].th,false,true);renderBuild()}
function buildUnpick(pos){const q=buildCur();if(q.checked!==null)return;q.picked.splice(pos,1);renderBuild()}
function buildReset(){const q=buildCur();q.picked=[];q.checked=null;renderBuild()}
function buildCheck(){const q=buildCur();if(!q.picked.length||q.checked!==null)return;const got=q.picked.map(n=>q.chips[n].th).join(''),want=q.tokens.map(t=>t.th).join('');q.checked=got===want;
 if(build.results[build.k]===undefined)build.results[build.k]=q.checked;
 speakThaiText(q.it.th,false,true);renderBuild()}
function buildListenAuto(){const q=build&&build.items[build.k];if(q&&!q.l&&!q.it.ja&&typeof speakThaiText==='function')speakThaiText(q.it.th,false,true)}// 訳のない文は出題時に読み上げる
function buildNext(){build.k=Math.min(build.k+1,build.items.length);renderBuild();window.scrollTo(0,0);buildListenAuto()}
function buildRetryWrong(){const wrong=build.items.filter((q,n)=>!build.results[n]).map(q=>q.key);if(!wrong.length)return;startReorder(wrong,build.origin==='lesson'?'review':build.origin,{...build.opts,lessonId:null})}
function buildAgain(){const b=build;if(b.origin==='lesson')startLessonTest(b.lessonId);else if(b.origin==='free')startFreeBuild();else startReorder(shuffle([...b.keys]),b.origin,b.opts)}
function buildExit(){const b=build;build=null;if(b&&b.origin==='lesson'){current=b.lessonId;view='lesson';render();window.scrollTo(0,0)}else if(b&&(b.origin==='free'||b.origin==='custom')){openBuildSetup()}else go(b&&b.origin==='review'?'review':'course')}
function renderBuild(){if(view!=='build')return;$('#main').innerHTML=buildView()}
function buildChip(c,attrs,cls=''){const ro=state.buildRo!==false&&!(build&&build.level&&build.level.noRo);return `<button class="bq-chip ${cls}" ${attrs}><span class="bq-th">${esc(c.th)}</span>${ro?`<span class="bq-ro">${esc(c.ro)}</span>`:''}</button>`}
function buildView(){if(!build)return buildSetupView();const n=build.items.length,lv=build.level;
 if(build.k>=n){const ok=build.results.filter(Boolean).length,lessonRun=build.origin==='lesson';return `<section class="bq"><div class="bq-top"><button class="textbtn" onclick="buildExit()">← 終了する</button><span>${lessonRun?'確認テスト':'並べ替え練習'}</span></div><div class="bq-done${lessonRun&&build.completed?' is-complete':''}"><div class="bq-score">${ok} / ${n}</div><p>${lessonRun?(ok===n?'全問正解！この課を履修済みにしました。':`全${n}問正解で履修済みになります。間違えた問題は「復習」に残ります。`):(ok===n?'全問正解です。語順が身についています。':'間違えた文は、もう一度並べて語順を確かめましょう。')}</p><div class="bq-actions">${ok<n?`<button class="btn" onclick="buildRetryWrong()">間違えた問題をもう一度</button>`:''}${build.origin==='custom'?`<button class="btn light" onclick="saveAllCustom()">${build.items.every(q=>isSaved(q.it.th))?'すべて保存済み':'すべての文を保存'}</button>`:''}<button class="btn light" onclick="buildAgain()">${lessonRun?'もう一度テスト':'別の問題で練習'}</button>${lessonRun&&build.completed&&orderedLessons.findIndex(l=>l.id===build.lessonId)<orderedLessons.length-1?`<button class="btn light" onclick="current=${build.lessonId};build=null;moveLesson(1)">次の課へ →</button>`:''}<button class="btn light" onclick="buildExit()">戻る</button></div></div></section>`}
 const q=buildCur(),done=q.checked!==null,need=q.tokens.length,showRo=state.buildRo!==false&&!(lv&&lv.noRo);
 const line=q.picked.length?q.picked.map((c,pos)=>buildChip(q.chips[c],done?'disabled':`onclick="buildUnpick(${pos})" aria-label="${esc(q.chips[c].th)} を外す"`,'is-placed')).join(''):`<span class="bq-placeholder">下の語をタップして、左から順に並べます</span>`;
 const bank=q.chips.map((c,k)=>q.picked.includes(k)?`<span class="bq-chip is-ghost" aria-hidden="true"><span class="bq-th">${esc(c.th)}</span>${showRo?`<span class="bq-ro">${esc(c.ro)}</span>`:''}</span>`:buildChip(c,done?'disabled':`onclick="buildPick(${k})"`)).join('');
 const result=done?`<div class="bq-result ${q.checked?'is-ok':'is-ng'}"><div class="bq-verdict">${q.checked?'正解':'正しい語順'}</div><div class="bq-answer"><span class="bq-ans-th">${q.tokens.map(t=>esc(t.th)).join(' ')}</span><button class="speak is-icon" onclick="speakThaiText(build.items[build.k].it.th)" aria-label="文を再生" title="文を再生">${icon('audio')}</button></div><div class="bq-ans-ro">${esc(q.it.ro)}</div><div class="bq-gloss">${q.tokens.map(t=>`<span><b>${esc(t.th)}</b>${esc(t.mean)}</span>`).join('')}</div>${q.it.why?`<p class="bq-note">${esc(q.it.why)}</p>`:''}${q.l?'':grammarChips(q.it.th)}</div>`:'';
 const mode=build.origin==='lesson'?'確認テスト':lv?`${'★'.repeat(lv.id)} ${lv.name}`:'並べ替え';
 return `<section class="bq"><div class="bq-top"><button class="textbtn" onclick="buildExit()">← 終了する</button><span>${build.k+1} / ${n}</span><span class="bq-mode">${mode}</span></div><div class="progress bq-progress"><span style="width:${build.k/n*100}%"></span></div>
 <div class="bq-card"><div class="bq-from">${q.l?`${esc(displayNumber(q.id))} ${esc(q.l.title)}`:`${esc(build.title||'入力した文')}${q.it.src==='mt'?' · <span class="bq-src is-mt">機械翻訳・未確認</span>':''}<button class="textbtn bq-save${isSaved(q.it.th)?' is-on':''}" onclick="toggleSaveCur()" aria-pressed="${isSaved(q.it.th)}">${isSaved(q.it.th)?'保存済み':'保存'}</button>`}</div>${q.it.ja?`<p class="bq-ja">${esc(q.it.ja)}</p>`:`<p class="bq-ja bq-listen"><button class="speak is-icon" onclick="speakThaiText(build.items[build.k].it.th)" aria-label="文を聞く" title="文を聞く">${icon('audio')}</button><span>音声を聞いて並べましょう</span></p>`}
 <button class="textbtn bq-hint-btn" onclick="build.hint=!build.hint;renderBuild()">${build.hint?'ヒントを隠す':'ヒント：文の形'}</button>${build.hint?`<div class="bq-hint">${q.l?esc(q.l.pattern):grammarLessonsFor(q.it.th).map(id=>esc(lessons[id-1].pattern)).join('<br>')}</div>`:''}
 <div class="bq-line ${done?(q.checked?'is-ok':'is-ng'):''}" aria-live="polite">${line}</div>
 <div class="bq-count">${q.picked.length} / ${need}語${q.chips.length>need?` · 使わない語が${q.chips.length-need}つ混ざっています`:''}</div>
 <div class="bq-bank">${bank}</div>
 ${result}
 <div class="bq-actions">${done?`${q.checked?'':`<button class="btn light" onclick="buildReset()">もう一度並べる</button>`}<button class="btn" onclick="buildNext()">${build.k<n-1?'次へ →':'結果を見る'}</button>`:`<button class="btn light" onclick="buildReset()" ${q.picked.length?'':'disabled'}>やり直す</button><button class="btn" onclick="buildCheck()" ${q.picked.length?'':'disabled'}>答え合わせ</button>`}</div>
 <div class="bq-opts">${lv&&lv.noRo?'<span>上級は読みを表示しません</span>':`<label><input type="checkbox" ${state.buildRo===false?'':'checked'} onchange="state.buildRo=this.checked;save();renderBuild()"> 読みを表示</label>`}<label><input type="checkbox" ${state.buildSound===false?'':'checked'} onchange="state.buildSound=this.checked;save()"> タップで発音</label></div></div></section>`}
