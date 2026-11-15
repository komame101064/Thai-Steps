// English Steps: English for Japanese speakers — 200 core words and beginner phrases.
// Data: data/words.json, data/phrases.json. Progress is kept in localStorage under english-steps-v1 (separate from Thai Steps).
const KEY='english-steps-v1',$=s=>document.querySelector(s),DAYS=[1,3,7,14,30,60],STEP=10;
const THEMES={people:'人',greetings:'あいさつ',food:'食べ物',animals:'動物',body:'体',places:'場所',home:'家',time:'時',weather:'天気',transport:'乗り物',money:'お金',actions:'動作',feelings:'気持ち',description:'様子',grammar:'文法の語',numbers:'数',colors:'色',work:'仕事',nature:'自然',basics:'基本',shopping:'買い物',directions:'道案内',smalltalk:'雑談',travel:'旅行',help:'困ったとき'};
const ICON={home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',words:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',phrases:'<path d="M4 5h16v10H9l-5 4z"/>',review:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',audio:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const today=()=>new Date().toISOString().slice(0,10);
let W=[],P=[],byId=new Map(),view='home',cur=null,sess=null,query='',theme='',ptheme='',favTab='w',loadState='loading';
// ---- state ----
const fresh=()=>({rec:{},today:{date:'',steps:0},streak:{last:'',days:0},perDay:1,rate:0.9});
let S=fresh();
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');S={...fresh(),...sanitize(v)}}catch{S=fresh()}}
function sanitize(v){const out=fresh();if(!v||typeof v!=='object')return out;for(const [id,r] of Object.entries(v.rec||{})){if(!/^e[np]-\d{3}$/.test(id)||!r||typeof r!=='object')continue;const n=x=>Math.max(0,Math.floor(Number(x)||0));out.rec[id]={seen:n(r.seen),stage:Math.min(6,n(r.stage)),due:n(r.due),fav:!!r.fav,ok:n(r.ok),ng:n(r.ng)}}
 if(v.today&&/^\d{4}-\d\d-\d\d$/.test(v.today.date))out.today={date:v.today.date,steps:Math.min(99,Math.max(0,Number(v.today.steps)||0))};if(v.streak&&/^\d{4}-\d\d-\d\d$/.test(v.streak.last))out.streak={last:v.streak.last,days:Math.max(0,Number(v.streak.days)||0)};if([1,2,3].includes(v.perDay))out.perDay=v.perDay;if([0.7,0.8,0.9,1].includes(v.rate))out.rate=v.rate;return out}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}
const rec=id=>S.rec[id]||{seen:0,stage:0,due:0,fav:false,ok:0,ng:0};
const setRec=(id,f)=>{S.rec[id]={...rec(id),...f};save()};
const isDue=id=>{const r=rec(id);return r.seen>0&&r.due&&r.due<=Date.now()};
const stepsToday=()=>S.today.date===today()?S.today.steps:0;
// ---- audio ----
let voices=[];function loadVoices(){if('speechSynthesis'in window)voices=speechSynthesis.getVoices()}
if('speechSynthesis'in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
function speak(t){if(!('speechSynthesis'in window)){toast('このブラウザは音声再生に対応していません');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=S.rate;const v=voices.find(v=>v.lang==='en-US')||voices.find(v=>/^en/.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1800)}
const audioBtn=(text,label='発音')=>`<button class="icon" onclick="speak(${esc(JSON.stringify(text))})" aria-label="${label}">${icon('audio')}</button>`;
const starBtn=id=>`<button class="icon star${rec(id).fav?' on':''}" onclick="toggleFav('${id}')" aria-pressed="${rec(id).fav}" aria-label="お気に入り">${icon('star')}</button>`;
function toggleFav(id){setRec(id,{fav:!rec(id).fav});render()}
// ---- navigation ----
function go(v){view=v;cur=null;sess=null;render();window.scrollTo(0,0)}
function openWord(id){cur=id;view='word';render();window.scrollTo(0,0)}
function nav(){const due=W.filter(w=>isDue(w.id)).length;const items=[['home','ホーム','home'],['words','単語','words'],['phrases','フレーズ','phrases'],['review','復習','review'],['favorites','お気に入り','star']];
 $('#tabs').innerHTML=items.map(([v,t,i])=>`<button aria-current="${view===v||(v==='words'&&view==='word')?'page':'false'}" onclick="go('${v}')">${icon(i)}${v==='review'&&due?`<span class="num">${due}</span>`:''}<span>${t}</span></button>`).join('')}
function render(){nav();$('#main').innerHTML=loadState!=='ready'?(loadState==='error'?'<div class="empty">読み込めませんでした。通信を確認して再読み込みしてください。</div>':'<div class="empty">読み込んでいます…</div>'):sess?sessionView():({home,words,word:wordDetail,phrases,review,favorites,settings}[view]||home)()}
// ---- home ----
function nextWords(){return W.filter(w=>!(rec(w.id).seen>0)).slice(0,STEP)}
function home(){const learned=W.filter(w=>rec(w.id).seen>0).length,next=nextWords(),due=W.filter(w=>isDue(w.id)).length,t=stepsToday(),met=t>=S.perDay,pct=Math.round(learned/W.length*100);
 return `<section class="card"><div class="daily-head"><h2 style="margin:0">今日の学習</h2>${met?'<span class="badge">✓ 今日の分は完了</span>':`<span class="muted">${t} / ${S.perDay}ステップ</span>`}</div>
 ${next.length||due?`<div class="tasks"><div class="task${due?'':' zero'}"><b>${Math.min(due,10)}</b><span>復習する語</span></div><div class="task${next.length?'':' zero'}"><b>${next.length}</b><span>新しい語</span></div></div>
 <button class="btn wide" onclick="startStep()">${met?'もう1ステップ進める →':'今日の学習をはじめる →'}</button>`:'<p><b>200語をすべて学習しました。</b>復習とフレーズで定着させましょう。</p>'}
 <div class="meta"><span>${S.streak.days&&S.streak.last>=yesterday()?`連続${S.streak.days}日`:''}</span><span>基本200語 ${learned} / ${W.length}</span></div><div class="bar"><i style="width:${pct}%"></i></div></section>
 <div class="home-links"><button class="home-link" onclick="go('phrases')"><b>フレーズ</b><small>${P.length}の定番表現</small></button><button class="home-link" onclick="go('words')"><b>単語一覧</b><small>200語・テーマ別</small></button></div>`}
const yesterday=()=>new Date(Date.now()-86400000).toISOString().slice(0,10);
// ---- words ----
const fold=s=>String(s).toLowerCase();
function wordList(){const q=fold(query.trim());return W.filter(w=>(!theme||w.theme===theme)&&(!q||fold(w.w).includes(q)||w.ja.includes(query.trim())))}
function words(){const xs=wordList(),themes=[...new Set(W.map(w=>w.theme))];
 return `<h1>単語</h1><input class="search" type="search" placeholder="英語・日本語で検索" value="${esc(query)}" oninput="query=this.value;document.getElementById('wl').innerHTML=wordRows()">
 <div class="chips"><button class="chip" aria-pressed="${!theme}" onclick="theme='';render()">すべて</button>${themes.map(t=>`<button class="chip" aria-pressed="${theme===t}" onclick="theme='${t}';render()">${THEMES[t]||t}</button>`).join('')}</div>
 <div class="row-actions" style="margin-bottom:10px"><button class="btn light" onclick="startQuiz('w',wordList(),'enja')">英→日 テスト</button><button class="btn light" onclick="startQuiz('w',wordList(),'jaen')">日→英 テスト</button><button class="btn light" onclick="startQuiz('w',wordList(),'listen')">聞き取り</button></div>
 <ul class="list" id="wl">${wordRows()}</ul>`}
function wordRows(){const xs=wordList();return xs.length?xs.map(w=>`<li>${rec(w.id).seen?'<span class="seen-dot" title="学習済み"></span>':''}<button class="item" onclick="openWord('${w.id}')"><b>${esc(w.w)}</b><span class="ipa">/${esc(w.ipa)}/</span><small>${esc(w.ja)}</small></button>${audioBtn(w.w)}${starBtn(w.id)}</li>`).join(''):'<li class="empty">見つかりません</li>'}
function wordDetail(){const w=byId.get(cur);if(!w)return words();const i=W.indexOf(w);
 return `<button class="btn light" onclick="go('words')" style="min-height:40px;margin-bottom:10px">← 単語一覧</button><section class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><p class="word-big">${esc(w.w)}</p><span class="ipa-big">/${esc(w.ipa)}/</span> <span class="pos">${esc(w.pos)}</span></div><div class="row-actions">${audioBtn(w.w)}${starBtn(w.id)}</div></div>
 <p class="ja-big">${esc(w.ja)}</p><div class="ex"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><p class="en">${esc(w.ex)}</p>${audioBtn(w.ex,'例文を再生')}</div><p>${esc(w.exJa)}</p></div>
 <p class="muted">${i+1}語目 · ${THEMES[w.theme]||w.theme}</p></section>
 <div class="row-actions">${i>0?`<button class="btn light" onclick="openWord('${W[i-1].id}')">← ${esc(W[i-1].w)}</button>`:''}${i<W.length-1?`<button class="btn light" onclick="openWord('${W[i+1].id}')">${esc(W[i+1].w)} →</button>`:''}</div>`}
// ---- phrases ----
function phraseList(){return P.filter(p=>!ptheme||p.theme===ptheme)}
function phrases(){const themes=[...new Set(P.map(p=>p.theme))],xs=phraseList();
 return `<h1>フレーズ</h1><div class="chips"><button class="chip" aria-pressed="${!ptheme}" onclick="ptheme='';render()">すべて</button>${themes.map(t=>`<button class="chip" aria-pressed="${ptheme===t}" onclick="ptheme='${t}';render()">${THEMES[t]||t}</button>`).join('')}</div>
 <div class="row-actions" style="margin-bottom:10px"><button class="btn light" onclick="startQuiz('p',phraseList(),'jaen')">日→英 テスト</button><button class="btn light" onclick="startQuiz('p',phraseList(),'listen')">聞き取り</button></div>
 <ul class="list">${xs.map(p=>`<li><button class="item" onclick="speak(${esc(JSON.stringify(p.en))})"><b>${esc(p.en)}</b><small>${esc(p.ja)}</small>${p.note?`<span class="muted">${esc(p.note)}</span>`:''}</button>${audioBtn(p.en)}${starBtn(p.id)}</li>`).join('')}</ul>`}
// ---- review / favorites ----
function review(){const due=W.filter(w=>isDue(w.id)),seen=W.filter(w=>rec(w.id).seen>0),weak=seen.filter(w=>rec(w.id).ng>0).sort((a,b)=>rec(b.id).ng-rec(a.id).ng);
 return `<h1>復習</h1><section class="card"><h2>今日の復習</h2><p>${due.length?`${due.length}語が復習の時期です。`:'今は復習する語はありません。'}</p><button class="btn wide" ${due.length?'':'disabled'} onclick="startQuiz('w',due,'mix',true)">復習をはじめる →</button></section>
 <section class="card"><h2>間違えた語</h2>${weak.length?`<p class="muted">${weak.length}語</p><button class="btn light" onclick="startQuiz('w',weak,'mix',true)">間違えた語をやり直す</button>`:'<p class="muted">まだありません。</p>'}</section>
 <section class="card"><h2>学習した語から</h2><button class="btn light" ${seen.length>=4?'':'disabled'} onclick="startQuiz('w',seen,'mix',true)">ランダムに10問</button></section>`}
function favorites(){const fw=W.filter(w=>rec(w.id).fav),fp=P.filter(p=>rec(p.id).fav),xs=favTab==='w'?fw:fp;
 return `<h1>お気に入り</h1><div class="chips"><button class="chip" aria-pressed="${favTab==='w'}" onclick="favTab='w';render()">単語 ${fw.length}</button><button class="chip" aria-pressed="${favTab==='p'}" onclick="favTab='p';render()">フレーズ ${fp.length}</button></div>
 ${xs.length?`<div class="row-actions" style="margin-bottom:10px"><button class="btn light" onclick="startQuiz('${favTab}',${favTab==='w'?'W':'P'}.filter(x=>rec(x.id).fav),'${favTab==='w'?'enja':'jaen'}')">お気に入りでテスト</button></div><ul class="list">${xs.map(x=>favTab==='w'?`<li><button class="item" onclick="openWord('${x.id}')"><b>${esc(x.w)}</b><small>${esc(x.ja)}</small></button>${audioBtn(x.w)}${starBtn(x.id)}</li>`:`<li><button class="item" onclick="speak(${esc(JSON.stringify(x.en))})"><b>${esc(x.en)}</b><small>${esc(x.ja)}</small></button>${audioBtn(x.en)}${starBtn(x.id)}</li>`).join('')}</ul>`:'<div class="empty">☆ を押すとここに集まります。</div>'}`}
function settings(){return `<h1>設定</h1><section class="card settings"><label>音声の速さ<select onchange="S.rate=Number(this.value);save()">${[[0.7,'ゆっくり'],[0.8,'やや遅め'],[0.9,'ふつう'],[1,'速め']].map(([v,t])=>`<option value="${v}" ${S.rate===v?'selected':''}>${t}</option>`).join('')}</select></label><label>1日のステップ数<select onchange="S.perDay=Number(this.value);save()">${[1,2,3].map(n=>`<option ${S.perDay===n?'selected':''}>${n}</option>`).join('')}</select></label></section>
 <section class="card"><h2>学習データ</h2><p class="muted">学習記録はこの端末のブラウザに保存されます。書き出して別の端末で読み込めます。</p><div class="row-actions"><button class="btn light" onclick="exportData()">書き出す</button><label class="btn light">読み込む<input type="file" accept="application/json" hidden onchange="importData(this.files[0])"></label></div></section>
`}
function exportData(){const b=new Blob([JSON.stringify({app:KEY,version:1,state:S},null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='english-steps-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function importData(f){if(!f)return;f.text().then(t=>{const v=JSON.parse(t);if(v.app!==KEY)throw Error();S=sanitize(v.state);save();toast('読み込みました');render()}).catch(()=>toast('読み込めませんでした'))}
// ---- sessions ----
// task: {type:'learn'|'enja'|'jaen'|'listen', id, kind:'w'|'p'}
function startStep(){const news=nextWords(),due=shuffle(W.filter(w=>isDue(w.id))).slice(0,10),tasks=[];
 news.forEach(w=>tasks.push({type:'learn',id:w.id,kind:'w'}));shuffle(news).forEach(w=>tasks.push({type:'enja',id:w.id,kind:'w'}));shuffle(news).forEach(w=>tasks.push({type:'jaen',id:w.id,kind:'w'}));due.forEach(w=>tasks.push({type:'enja',id:w.id,kind:'w'}));
 if(!tasks.length){toast('学習する語がありません');return}sess={kind:'step',tasks,i:0,ok:0,total:0,answered:null,missed:new Set(),news:news.map(w=>w.id)};render();window.scrollTo(0,0);autoSpeak()}
function startQuiz(kind,pool,mode,srs=false){const ok=kind==='p'?pool:pool;if(ok.length<2){toast('問題を作れる語が足りません');return}const pick=shuffle(ok).slice(0,10),tasks=pick.map(x=>({type:mode==='mix'?['enja','jaen','listen'][Math.floor(Math.random()*3)]:mode,id:x.id,kind}));
 sess={kind:'quiz',srs,tasks,i:0,ok:0,total:0,answered:null,missed:new Set()};render();window.scrollTo(0,0);autoSpeak()}
const item=t=>t.kind==='w'?byId.get(t.id):byId.get(t.id);
const en=x=>x.w||x.en;
function choicesFor(t){const x=item(t),pool=(t.kind==='w'?W:P).filter(y=>y.id!==x.id),others=shuffle(pool.filter(y=>(t.kind!=='w'||y.pos===x.pos))).slice(0,3);while(others.length<3){const y=shuffle(pool).find(y=>!others.includes(y));if(!y)break;others.push(y)}return shuffle([x,...others])}
function autoSpeak(){const t=sess&&sess.tasks[sess.i];if(!t)return;const x=item(t);if(t.type==='learn'||t.type==='listen'||t.type==='enja')setTimeout(()=>speak(en(x)),200)}
function sessionView(){const s=sess,n=s.tasks.length;if(s.i>=n)return resultView();const t=s.tasks[s.i],x=item(t);
 const top=`<div class="sess-top"><button class="btn light" style="min-height:40px" onclick="endSession()">← 終了</button><span class="muted">${s.i+1} / ${n}</span></div><div class="progress"><i style="width:${s.i/n*100}%"></i></div>`;
 if(t.type==='learn')return top+`<section class="card"><p class="muted">新しい語</p><div style="display:flex;justify-content:space-between;gap:8px"><div><p class="word-big">${esc(x.w)}</p><span class="ipa-big">/${esc(x.ipa)}/</span> <span class="pos">${esc(x.pos)}</span></div>${audioBtn(x.w)}</div><p class="ja-big">${esc(x.ja)}</p><div class="ex"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><p class="en">${esc(x.ex)}</p>${audioBtn(x.ex,'例文を再生')}</div><p>${esc(x.exJa)}</p></div></section><button class="btn wide next" onclick="nextTask()">覚えた → 次へ</button>`;
 if(!s.choices||s.choicesFor!==s.i){s.choices=choicesFor(t);s.choicesFor=s.i}
 const label=c=>t.type==='jaen'?en(c):c.ja,done=s.answered!==null;
 const prompt=t.type==='enja'?`<div class="q-prompt"><div class="big">${esc(en(x))}</div>${x.ipa?`<div class="sub">/${esc(x.ipa)}/</div>`:''}<button class="icon" style="margin:8px auto 0" onclick="speak(${esc(JSON.stringify(en(x)))})" aria-label="発音">${icon('audio')}</button><div class="sub">意味は？</div></div>`:t.type==='jaen'?`<div class="q-prompt"><div class="big" style="font-size:1.5rem">${esc(x.ja)}</div><div class="sub">英語は？</div></div>`:`<div class="q-prompt"><button class="play" onclick="speak(${esc(JSON.stringify(en(x)))})" aria-label="もう一度聞く">${icon('audio')}</button><div class="sub">聞こえた英語の意味は？</div></div>`;
 return top+`<section class="card">${prompt}<div class="choices">${s.choices.map((c,k)=>`<button class="choice${done?(c.id===x.id?' ok':k===s.answered?' ng':''):''}" ${done?'disabled':''} onclick="answer(${k})">${esc(label(c))}${done&&t.type!=='jaen'?` <span class="muted">${esc(en(c))}</span>`:''}</button>`).join('')}</div>${done?`<div class="ex" style="margin-top:12px"><p class="en">${esc(en(x))} ${x.ipa?`<span class="muted">/${esc(x.ipa)}/</span>`:''}</p><p>${esc(x.ja)}</p>${x.ex?`<p class="muted" style="margin-top:6px">${esc(x.ex)} — ${esc(x.exJa)}</p>`:''}</div>`:''}</section>${done?`<button class="btn wide next" onclick="nextTask()">${s.i<n-1?'次へ →':'結果を見る'}</button>`:''}`}
function answer(k){const s=sess,t=s.tasks[s.i],x=item(t);if(s.answered!==null)return;s.answered=k;const ok=s.choices[k].id===x.id;s.total++;if(ok)s.ok++;else{s.missed.add(x.id);if(s.kind==='step'&&!s.tasks.slice(s.i+1).some(u=>u.id===x.id&&u.type===t.type))s.tasks.push({...t})}
 if(t.kind==='w'||t.kind==='p'){const r=rec(x.id);if(s.kind==='quiz'&&!s.srs){setRec(x.id,{seen:Math.max(1,r.seen),ok:r.ok+(ok?1:0),ng:r.ng+(ok?0:1)})}else if(!(s.kind==='step'&&s.news.includes(x.id))){const st=ok?Math.min(6,(r.stage||0)+1):0;setRec(x.id,{seen:r.seen+1,stage:st,due:ok?Date.now()+DAYS[st-1]*86400000:Date.now(),ok:r.ok+(ok?1:0),ng:r.ng+(ok?0:1)})}else setRec(x.id,{ok:r.ok+(ok?1:0),ng:r.ng+(ok?0:1)})}
 speak(en(x));render()}
function nextTask(){const s=sess;s.i++;s.answered=null;s.choices=null;if(s.i>=s.tasks.length)finishSession();render();window.scrollTo(0,0);autoSpeak()}
function finishSession(){const s=sess;if(s.kind!=='step'||s.finished)return;s.finished=true;const now=Date.now();
 for(const id of s.news){const r=rec(id),miss=s.missed.has(id);setRec(id,{seen:r.seen+1,stage:miss?0:1,due:miss?now:now+DAYS[0]*86400000})}
 const d=today();S.today=S.today.date===d?{date:d,steps:S.today.steps+1}:{date:d,steps:1};if(S.streak.last!==d)S.streak={last:d,days:S.streak.last===yesterday()?S.streak.days+1:1};save()}
function resultView(){const s=sess;return `<section class="card result"><p class="muted">${s.kind==='step'?'ステップ完了':'テスト結果'}</p><div class="score">${s.ok} / ${s.total}</div><p>${s.ok===s.total?'全問正解です！':'間違えた語は復習に残ります。'}</p><div class="row-actions" style="justify-content:center">${s.missed.size?`<button class="btn" onclick="startQuiz('w',[...sess.missed].map(id=>byId.get(id)).filter(x=>x&&x.w),'enja',true)">間違えた語をもう一度</button>`:''}<button class="btn light" onclick="endSession()">戻る</button></div></section>`}
function endSession(){if(sess&&sess.kind==='step'&&sess.i>=sess.tasks.length)finishSession();sess=null;render();window.scrollTo(0,0)}
// ---- boot ----
load();
Promise.all(['data/words.json','data/phrases.json'].map(u=>fetch(u+'?v=20261115b').then(r=>{if(!r.ok)throw Error();return r.json()}))).then(([w,p])=>{W=w;P=p;byId=new Map([...W,...P].map(x=>[x.id,x]));loadState='ready';render()}).catch(()=>{loadState='error';render()});
if(typeof navigator!=='undefined'&&'serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});
window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(['home','words','phrases','review','favorites','settings'].includes(v))go(v)});
render();
if(typeof module!=='undefined')module.exports={};
