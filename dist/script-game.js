// 文字ゲーム: game-style practice for the Thai script course. Uses only letters and readings from lessons the
// learner has finished (scriptState.done) plus the lesson they are on now (scriptNext()). Best scores are kept in
// scriptState.games (sanitized by sanitizeScriptGames in script-app.js) so they travel with the settings export.
// All top-level names start with sg to stay clear of the other files' globals.
const SG_MODES=[
 {id:'speed',title:'スピード読み',desc:'60秒で、出てきた字の音（頭子音）をできるだけ多く選ぶ。',kind:'run'},
 {id:'listen',title:'聞いて選ぶ',desc:'字の名前を聞いて、その字を選ぶ。60秒勝負。',kind:'run'},
 {id:'tone',title:'声調あて',desc:'1音節の語を見て、5つの声調から選ぶ。60秒勝負。',kind:'run'},
 {id:'match',title:'ペアそろえ',desc:'字と音のカードを2枚ずつめくって6組そろえる。タイムを縮めよう。',kind:'match'}];
const SG_TONE_ORDER=['mid','low','falling','high','rising'],SG_RUN_MS=60000,SG_MIN=4,SG_PAIRS=6;
let sgGame=null,sgTimer=null,sgWait=null,sgSeq=0;
const sgShuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const sgSound=c=>c&&typeof c.initial==='string'?c.initial:'';
const sgSoundLabel=s=>s===''?'無音':s;
// Lessons in play: finished ones plus the current one (done may be out of order or hold stale ids, so filter by id).
function sgLessons(){const ls=typeof scriptLessons==='function'?scriptLessons():[],next=ls.length?scriptNext():null;return ls.filter(l=>scriptState.done.includes(l.id)||(next&&l.id===next.id))}
function sgLetters(ls=sgLessons()){const seen=new Set,out=[];for(const l of ls)for(const ch of l.newConsonants||[]){const c=consonantInfo(ch);if(c&&!seen.has(ch)){seen.add(ch);out.push(c)}}return out}
function sgSounds(letters){return [...new Set(letters.map(sgSound))]}
// Tone items: one-syllable readings whose data tone is exactly one of the five tones; digits are left out.
function sgToneItems(ls=sgLessons()){const seen=new Set,out=[];for(const l of ls)for(const r of l.readings||[]){if(!r||typeof r.th!=='string'||!SG_TONE_ORDER.includes(r.tone)||/\s/.test(r.th)||/\s/.test(String(r.ro||'').trim())||/[๐-๙]/.test(r.th)||seen.has(r.th))continue;seen.add(r.th);out.push(r)}return out}
function sgAvailability(mode,ls=sgLessons()){
 if(mode==='tone'){const items=sgToneItems(ls),tones=new Set(items.map(r=>r.tone));if(items.length<SG_MIN)return {ok:false,why:`1音節の読みがあと${SG_MIN-items.length}語必要です。`};if(tones.size<2)return {ok:false,why:'声調が2種類以上出てくる課（第3段階〜）まで進むと遊べます。'};return {ok:true,count:items.length}}
 const n=sgSounds(sgLetters(ls)).length;if(n<SG_MIN)return {ok:false,why:`音の違う字があと${SG_MIN-n}つ必要です。課を進めると解放されます。`};
 if(mode==='listen'&&!(typeof window!=='undefined'&&'speechSynthesis'in window))return {ok:false,why:'このブラウザは音声再生に対応していません。'};
 return {ok:true,count:n}}
// Letter questions: the options all have different sounds, so exactly one option is correct.
function sgLetterOptions(letters,target){const s=sgSound(target),used=new Set([s]),wrong=[];for(const c of sgShuffle(letters)){const k=sgSound(c);if(used.has(k))continue;used.add(k);wrong.push(c);if(wrong.length===3)break}return wrong.length<3?null:sgShuffle([target,...wrong])}
function sgPickTarget(items,prev){const pool=items.length>1?items.filter(x=>x!==prev):items;return pool[Math.floor(Math.random()*pool.length)]}
function sgSpeedQuestion(letters,prev){const c=sgPickTarget(letters,prev),o=sgLetterOptions(letters,c);if(!o)return null;return {kind:'speed',target:c,options:o.map(sgSound),answer:sgSound(c)}}
function sgListenQuestion(letters,prev){const c=sgPickTarget(letters,prev),o=sgLetterOptions(letters,c);if(!o)return null;return {kind:'listen',target:c,options:o.map(x=>x.ch),answer:c.ch,speak:c.name}}
function sgToneQuestion(items,prev){const r=sgPickTarget(items,prev);return {kind:'tone',target:r,options:[...SG_TONE_ORDER],answer:r.tone,speak:r.th}}
function sgMatchBoard(letters){const by=new Map;for(const c of sgShuffle(letters)){const k=sgSound(c);if(!by.has(k))by.set(k,c)}const pairs=[...by.values()].slice(0,SG_PAIRS);if(pairs.length<SG_MIN)return null;
 return sgShuffle([...pairs.map(c=>({side:'letter',key:sgSound(c),ch:c.ch,label:c.ch})),...pairs.map(c=>({side:'sound',key:sgSound(c),ch:c.ch,label:sgSoundLabel(sgSound(c))}))]).map((t,i)=>({...t,i,matched:false}))}
function sgMult(combo){return Math.min(4,1+Math.floor(combo/5))}
function sgBest(mode){const g=scriptState.games&&scriptState.games[mode];return g?(mode==='match'?g.bestTime:g.best):undefined}
function sgVoiceWarning(){try{if(!('speechSynthesis'in window))return 'このブラウザは音声再生に対応していません。';const vs=speechSynthesis.getVoices();if(vs.length&&!vs.some(v=>/^th/i.test(v.lang)))return 'タイ語（th-TH）の音声が端末に見つかりません。設定で音声を確認してください。'}catch(e){}return ''}
function sgSpeak(text){if(text&&typeof speakThaiText==='function')speakThaiText(text,false,true)}
// Timers: one interval for the clock and one timeout for answer feedback. Both are cleared on every exit path.
function scriptGameStop(){if(sgTimer!==null){clearInterval(sgTimer);sgTimer=null}if(sgWait!==null){clearTimeout(sgWait);sgWait=null}sgSeq++;try{if(typeof window!=='undefined'&&'speechSynthesis'in window&&sgGame&&sgGame.mode==='listen')speechSynthesis.cancel()}catch(e){}}
function sgAlive(g){return typeof view!=='undefined'&&view==='scriptGame'&&sgGame===g}
function openScriptGame(){scriptGameStop();sgGame=null;view='scriptGame';render();window.scrollTo(0,0)}
function sgNextQuestion(g){const prev=g.q&&g.q.target;g.q=g.mode==='speed'?sgSpeedQuestion(g.pool,prev):g.mode==='listen'?sgListenQuestion(g.pool,prev):sgToneQuestion(g.pool,prev);g.choice=null}
function startScriptGame(mode){scriptGameStop();const ls=sgLessons(),a=sgAvailability(mode,ls);if(!a.ok){sgGame=null;view='scriptGame';render();return}
 const seq=sgSeq;
 if(mode==='match'){sgGame={mode,phase:'play',tiles:sgMatchBoard(sgLetters(ls)),open:[],mismatches:0,missed:[],startedAt:Date.now(),seq}}
 else{sgGame={mode,phase:'play',pool:mode==='tone'?sgToneItems(ls):sgLetters(ls),score:0,combo:0,maxCombo:0,correct:0,total:0,missed:[],q:null,choice:null,deadline:Date.now()+SG_RUN_MS,seq};sgNextQuestion(sgGame)}
 const g=sgGame;view='scriptGame';render();window.scrollTo(0,0);
 sgTimer=setInterval(()=>sgTick(g),200);if(mode==='listen')sgSpeak(g.q.speak)}
function sgTick(g){if(!sgAlive(g)||g.phase!=='play'){scriptGameStop();return}
 if(g.mode==='match'){const el=document.getElementById('sg-time');if(el)el.textContent=sgFmtTime((Date.now()-g.startedAt)/1000);return}
 const left=Math.max(0,g.deadline-Date.now());const bar=document.getElementById('sg-bar'),t=document.getElementById('sg-time');if(bar)bar.style.width=`${left/SG_RUN_MS*100}%`;if(t)t.textContent=Math.ceil(left/1000);if(left<=0)sgFinish(g)}
const sgFmtTime=s=>`${(Math.round(s*10)/10).toFixed(1)}秒`;
function sgFinish(g){if(sgGame!==g||g.phase!=='play')return;scriptGameStop();g.phase='end';const games=scriptState.games||(scriptState.games={});
 if(g.mode==='match'){g.time=Math.max(0.1,Math.round((Date.now()-g.startedAt)/100)/10);const prev=games.match&&games.match.bestTime;g.newBest=g.time>=3&&(!(prev>0)||g.time<prev);if(g.newBest)games.match={bestTime:g.time}}
 else{const prev=games[g.mode]&&games[g.mode].best;g.newBest=g.score>0&&!(prev>=g.score);if(g.newBest)games[g.mode]={best:g.score}}
 if(typeof sanitizeScriptGames==='function')scriptState.games=sanitizeScriptGames(scriptState.games);saveScript();if(typeof view!=='undefined'&&view==='scriptGame')render()}
function sgMiss(g,item){const key=g.mode==='tone'?item.th:item.ch;if(!g.missed.some(m=>(m.th||m.ch)===key))g.missed.push(item)}
function scriptGameAnswer(n){const g=sgGame;if(!g||g.phase!=='play'||g.mode==='match'||g.choice!==null||!g.q)return;if(Date.now()>=g.deadline){sgFinish(g);return}
 g.choice=n;g.total++;const ok=g.q.options[n]===g.q.answer;
 if(ok){g.combo++;g.maxCombo=Math.max(g.maxCombo,g.combo);g.correct++;g.gain=10*sgMult(g.combo);g.score+=g.gain}else{g.combo=0;g.gain=0;sgMiss(g,g.q.target)}
 render();if(g.mode==='tone')sgSpeak(g.q.speak);
 sgWait=setTimeout(()=>{sgWait=null;if(!sgAlive(g)||g.phase!=='play')return;if(Date.now()>=g.deadline){sgFinish(g);return}sgNextQuestion(g);render();if(g.mode==='listen')sgSpeak(g.q.speak)},ok?(g.mode==='tone'?650:380):1100)}
function scriptGameTap(i){const g=sgGame;if(!g||g.mode!=='match'||g.phase!=='play')return;const t=g.tiles[i];if(!t||t.matched||g.open.includes(i)||g.open.length>=2)return;
 g.open.push(i);if(g.open.length<2){render();return}
 const [a,b]=g.open.map(x=>g.tiles[x]);
 if(a.side!==b.side&&a.key===b.key){a.matched=b.matched=true;g.open=[];g.flash='ok';render();g.flash=null;if(g.tiles.every(x=>x.matched))sgFinish(g);return}
 g.mismatches++;g.flash='bad';for(const x of [a,b])if(x.side==='letter'){const c=consonantInfo(x.ch);if(c)sgMiss(g,c)}render();g.flash=null;
 sgWait=setTimeout(()=>{sgWait=null;if(!sgAlive(g)||g.phase!=='play')return;g.open=[];render()},750)}
function sgLeave(){scriptGameStop();sgGame=null;openScript()}

// ---- views ----
function scriptGameCard(){const ready=SG_MODES.filter(m=>sgAvailability(m.id).ok).length;
 return `<button type="button" class="sg-entry" onclick="openScriptGame()"><span class="sg-entry-icon" aria-hidden="true">${icon('spark')}</span><span class="sg-entry-body"><b>文字ゲーム</b><small>${ready?`スピード読み・聞き取り・声調・ペア · ${ready}/4 モード`:'課を進めるとゲームが解放されます'}</small></span><span class="sg-entry-end">${icon('arrow')}</span></button>`}
function sgHub(){const ls=sgLessons(),letters=sgLetters(ls),next=typeof scriptNext==='function'?scriptNext():null;
 return `<button class="textbtn back" onclick="sgLeave()">← 文字の一覧に戻る</button><div class="x-head"><h1>文字ゲーム</h1><span class="x-inventory">習った字 ${letters.length} · 読み ${sgToneItems(ls).length}</span></div><p class="s-lead">出題は履修済みの課と、いま学んでいる課（${esc(next?next.id:'')}）の字だけ。連続正解でコンボ倍率が上がります。</p>${next&&SG_MODES.some(m=>!sgAvailability(m.id,ls).ok)?`<p class="sg-unlock"><button class="btn light" onclick="openScriptLesson('${next.id}')">${esc(next.id)} の課を学ぶ ${icon('arrow')}</button><span>課を履修すると出題範囲が広がり、ゲームが解放されます。</span></p>`:''}
 <div class="sg-modes">${SG_MODES.map(m=>{const a=sgAvailability(m.id,ls),b=sgBest(m.id);return `<article class="sg-mode${a.ok?'':' is-locked'}"><div class="sg-mode-head"><h2>${esc(m.title)}</h2><span class="sg-best">${b!==undefined?(m.id==='match'?`ベスト ${sgFmtTime(b)}`:`ベスト ${b}点`):'記録なし'}</span></div><p>${esc(m.desc)}</p>${a.ok?`${m.id==='listen'&&sgVoiceWarning()?`<p class="sg-warn" role="note">${esc(sgVoiceWarning())}</p>`:''}<button class="btn sg-start" onclick="startScriptGame('${m.id}')">はじめる ${icon('arrow')}</button>`:`<p class="sg-lock" role="note">${esc(a.why)}</p>`}</article>`}).join('')}</div>`}
function sgHud(g){const left=Math.max(0,g.deadline-Date.now()),m=sgMult(g.combo);
 return `<div class="sg-hud"><button class="sg-quit" onclick="openScriptGame()" aria-label="ゲームをやめる">×</button><div class="sg-stat"><small>スコア</small><b>${g.score}</b></div><div class="sg-stat sg-combo${g.combo>=2?' is-on':''}"><small>コンボ</small><b>${g.combo}${m>1?`<em>×${m}</em>`:''}</b></div><div class="sg-stat"><small>残り</small><b><span id="sg-time">${Math.ceil(left/1000)}</span>秒</b></div></div><div class="sg-timer" aria-hidden="true"><div id="sg-bar" style="width:${left/SG_RUN_MS*100}%"></div></div>`}
function sgRunView(g){const q=g.q,answered=g.choice!==null,ok=answered&&q.options[g.choice]===q.answer,c=q.target;
 const prompt=g.mode==='speed'?'この字の音は？':g.mode==='listen'?'聞こえた字は？':'声調は？';
 const stage=g.mode==='speed'?`<div class="sg-glyph" lang="th">${esc(c.ch)}</div>`:g.mode==='listen'?`<div class="sg-listen"><button type="button" class="s-audio is-icon sg-replay" aria-label="もう一度聞く" title="もう一度聞く" onclick="sgSpeak(sgGame&&sgGame.q&&sgGame.q.speak)">${icon('audio')}</button>${answered?`<span class="sg-reveal" lang="th">${esc(c.name)}</span>`:''}</div>`:`<div class="sg-glyph sg-word" lang="th">${esc(c.th)}</div>${answered?`<div class="sg-reveal"><span lang="th-Latn">${esc(c.ro)}</span>${c.ja?` · ${esc(c.ja)}`:''}</div>`:''}`;
 const label=o=>g.mode==='speed'?`<span class="sg-ro">${esc(sgSoundLabel(o))}</span>`:g.mode==='listen'?`<span class="sg-opt-th" lang="th">${esc(o)}</span>`:`<span>${esc(SCRIPT_TONES[o])}</span>`;
 const warn=g.mode==='listen'?sgVoiceWarning():'';
 return `<div class="sg-root sg-play sg-is-${g.mode}">${sgHud(g)}${warn?`<p class="sg-warn" role="note">${esc(warn)}</p>`:''}<section class="sg-stage${answered?(ok?' is-ok':' is-bad'):''}"><div class="sg-prompt">${prompt}${answered?`<span class="sg-gain${ok?'':' is-bad'}" role="status">${ok?`+${g.gain}`:'ミス'}</span>`:''}</div>${stage}</section><div class="sg-options sg-n${q.options.length}">${q.options.map((o,n)=>`<button type="button" class="sg-opt${answered&&o===q.answer?' is-correct':''}${answered&&n===g.choice&&!ok?' is-wrong':''}" ${answered?'disabled':''} onclick="scriptGameAnswer(${n})">${label(o)}</button>`).join('')}</div></div>`}
function sgMatchView(g){const el=(Date.now()-g.startedAt)/1000,b=sgBest('match');
 return `<div class="sg-root sg-play sg-match"><div class="sg-hud"><button class="sg-quit" onclick="openScriptGame()" aria-label="ゲームをやめる">×</button><div class="sg-stat"><small>そろった</small><b>${g.tiles.filter(t=>t.matched).length/2} / ${g.tiles.length/2}</b></div><div class="sg-stat"><small>ミス</small><b>${g.mismatches}</b></div><div class="sg-stat"><small>タイム</small><b id="sg-time">${sgFmtTime(el)}</b></div></div><p class="sg-sub">字と音を1枚ずつめくって組にしよう。${b!==undefined?`ベスト ${sgFmtTime(b)}`:''}</p>
 <div class="sg-board${g.flash==='bad'?' is-bad':''}">${g.tiles.map(t=>{const open=g.open.includes(t.i);return `<button type="button" class="sg-tile is-${t.side}${t.matched?' is-matched':''}${open?' is-open':''}${open&&g.flash==='bad'?' is-wrong':''}" ${t.matched?'disabled':''} aria-label="${t.matched||open?esc(t.label):'カード'}" onclick="scriptGameTap(${t.i})">${t.matched||open?`<span${t.side==='letter'?' lang="th"':' class="sg-ro"'}>${esc(t.label)}</span>`:'<span class="sg-back" aria-hidden="true"></span>'}</button>`}).join('')}</div></div>`}
function sgEndView(g){const mode=SG_MODES.find(m=>m.id===g.mode),b=sgBest(g.mode),isMatch=g.mode==='match';
 const missed=g.missed.map(x=>g.mode==='tone'?`<li><span class="sg-miss-th" lang="th">${esc(x.th)}</span><span class="sg-miss-body"><b lang="th-Latn">${esc(x.ro)}</b><small>${esc(SCRIPT_TONES[x.tone]||'')}${x.ja?` · ${esc(x.ja)}`:''}</small></span>${scriptAudio(x.th)}</li>`:`<li><span class="sg-miss-th" lang="th">${esc(x.ch)}</span><span class="sg-miss-body"><b>${esc(sgSoundLabel(sgSound(x)))}</b><small><span lang="th">${esc(x.name)}</span> · ${esc(x.nameRo)} · ${esc(SCRIPT_CLASS[x.cls]||'')}</small></span>${scriptAudio(x.name,'名前')}</li>`).join('');
 return `<div class="sg-root sg-end"><div class="sg-end-card"><div class="eyebrow">文字ゲーム · ${esc(mode.title)}</div><h1>${isMatch?sgFmtTime(g.time):`${g.score}<small>点</small>`}</h1>${g.newBest?'<p class="sg-newbest">ベスト更新！</p>':`<p class="subtext">ベスト ${b!==undefined?(isMatch?sgFmtTime(b):`${b}点`):'—'}</p>`}
 <div class="sg-end-stats">${isMatch?`<span>ミス <b>${g.mismatches}</b></span><span>組 <b>${g.tiles.length/2}</b></span>`:`<span>正解 <b>${g.correct} / ${g.total}</b></span><span>最大コンボ <b>${g.maxCombo}</b></span>`}</div>
 <div class="sg-end-actions"><button class="btn" onclick="startScriptGame('${g.mode}')">もう一度</button><button class="btn light" onclick="openScriptGame()">ゲーム一覧</button></div></div>
 ${missed?`<section class="sg-missed"><h2>間違えた${g.mode==='tone'?'語':'字'}（${g.missed.length}）</h2><ul>${missed}</ul></section>`:`<p class="sg-perfect">${g.total||isMatch?'ミスなし。この調子！':''}</p>`}</div>`}
function scriptGameView(){const g=sgGame;if(!g)return `<div class="sg-root">${sgHub()}</div>`;if(g.phase==='end')return sgEndView(g);return g.mode==='match'?sgMatchView(g):sgRunView(g)}
// Number keys 1–5 answer during a run (desktop).
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('keydown',e=>{if(typeof view==='undefined'||view!=='scriptGame'||!sgGame||sgGame.phase!=='play'||sgGame.mode==='match'||e.ctrlKey||e.metaKey||e.altKey)return;const n=Number(e.key)-1;if(Number.isInteger(n)&&n>=0&&sgGame.q&&n<sgGame.q.options.length){e.preventDefault();scriptGameAnswer(n)}});
