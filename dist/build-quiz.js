// 並べ替え練習（文の組み立て）: 日本語文を見て、バラバラのタイ語を順にタップして文を組み立てる。
// 文法の例文（lessons[].examples）を wordsFor() で語に分けて使う。学習記録には書き込まない（セッション内のみ）。
let build=null;
function buildTokens(l,i){try{return wordsFor(l,i).map(w=>({th:w.th,ro:w.ro,mean:w.meaning||''}))}catch{return null}}
function buildPool(lessonIds){const out=[];for(const id of lessonIds){const l=lessons[id-1];if(!l)continue;l.examples.forEach((e,i)=>{const t=buildTokens(l,i);if(t&&t.length>=3)out.push({id,i})})}return out}
function buildDistractors(tokens,count){const have=new Set(tokens.map(t=>t.th)),cands=[];for(const l of lessons)l.examples.forEach((e,i)=>{const t=buildTokens(l,i);if(t)for(const w of t)if(!have.has(w.th)&&!cands.some(c=>c.th===w.th))cands.push(w)});return shuffle(cands).slice(0,count)}
function buildMakeItem(q){const l=lessons[q.id-1],e=l.examples[q.i],tokens=buildTokens(l,q.i),extra=buildDistractors(tokens,tokens.length>=5?2:1),chips=shuffle([...tokens.map((t,k)=>({...t,k})),...extra.map(t=>({...t,k:-1}))]);
 // 正解と同じ並びでシャッフルされたら並べ直す
 if(chips.filter(c=>c.k>=0).every((c,n,a)=>n===0||a[n-1].k<c.k))chips.reverse();
 return {...q,l,e,tokens,chips,picked:[],checked:null}}
function startBuild(lessonIds,title){const pool=buildPool(lessonIds);if(!pool.length){toast('この範囲には並べ替えできる例文がありません。');return}
 const qs=shuffle(pool).slice(0,10);build={title,lessonIds,items:qs.map(buildMakeItem),k:0,results:[],hint:false};view='build';render();window.scrollTo(0,0)}
function startLessonBuild(id){startBuild([id],`${displayNumber(id)} ${lessons[id-1].title}`)}
function startMixedBuild(){const done=lessons.filter(l=>state.done.includes(l.id)).map(l=>l.id);const ids=done.length>=2?done:orderedLessons.slice(0,Math.max(3,orderedLessons.findIndex(l=>!state.done.includes(l.id))+1)).map(l=>l.id);startBuild(ids,done.length>=2?'履修した課から':'はじめの課から')}
function buildCur(){return build.items[build.k]}
function buildPick(n){const q=buildCur();if(q.checked!==null||q.picked.includes(n))return;q.picked.push(n);const c=q.chips[n];if(state.buildSound!==false)speakThaiText(c.th,false,true);renderBuild()}
function buildUnpick(pos){const q=buildCur();if(q.checked!==null)return;q.picked.splice(pos,1);renderBuild()}
function buildReset(){const q=buildCur();q.picked=[];q.checked=null;renderBuild()}
function buildCheck(){const q=buildCur();if(!q.picked.length)return;const got=q.picked.map(n=>q.chips[n].th).join(''),want=q.tokens.map(t=>t.th).join('');q.checked=got===want;build.results[build.k]=q.checked;speakThaiText(q.e.th,false,true);renderBuild()}
function buildNext(){if(build.k<build.items.length-1){build.k++;renderBuild();window.scrollTo(0,0)}else{build.k=build.items.length;renderBuild();window.scrollTo(0,0)}}
function buildRetryWrong(){const wrong=build.items.filter((q,n)=>!build.results[n]).map(q=>({id:q.id,i:q.i}));if(!wrong.length)return;build={...build,items:wrong.map(buildMakeItem),k:0,results:[]};renderBuild();window.scrollTo(0,0)}
function buildExit(){const ids=build&&build.lessonIds;build=null;if(ids&&ids.length===1){current=ids[0];view='lesson'}else view='course';render();window.scrollTo(0,0)}
function renderBuild(){if(view!=='build')return;$('#main').innerHTML=buildView()}
function buildChip(c,attrs,cls=''){return `<button class="bq-chip ${cls}" ${attrs}><span class="bq-th">${esc(c.th)}</span>${state.buildRo===false?'':`<span class="bq-ro">${esc(c.ro)}</span>`}</button>`}
function buildView(){if(!build)return course();const n=build.items.length;
 if(build.k>=n){const ok=build.results.filter(Boolean).length;return `<section class="bq"><div class="bq-top"><button class="textbtn" onclick="buildExit()">← 終了する</button><span>並べ替え練習</span></div><div class="bq-done"><div class="bq-score">${ok} / ${n}</div><p>${ok===n?'全問正解です。語順が身についています。':'間違えた文は、もう一度並べて語順を確かめましょう。'}</p><div class="bq-actions">${ok<n?`<button class="btn" onclick="buildRetryWrong()">間違えた文をもう一度</button>`:''}<button class="btn light" onclick="startBuild(build.lessonIds,build.title)">別の文で練習</button><button class="btn light" onclick="buildExit()">戻る</button></div></div></section>`}
 const q=buildCur(),done=q.checked!==null,need=q.tokens.length;
 const line=q.picked.length?q.picked.map((c,pos)=>buildChip(q.chips[c],done?'disabled':`onclick="buildUnpick(${pos})" aria-label="${esc(q.chips[c].th)} を外す"`,'is-placed')).join(''):`<span class="bq-placeholder">下の語をタップして、左から順に並べます</span>`;
 const bank=q.chips.map((c,k)=>q.picked.includes(k)?`<span class="bq-chip is-ghost" aria-hidden="true"><span class="bq-th">${esc(c.th)}</span>${state.buildRo===false?'':`<span class="bq-ro">${esc(c.ro)}</span>`}</span>`:buildChip(c,done?'disabled':`onclick="buildPick(${k})"`)).join('');
 const result=done?`<div class="bq-result ${q.checked?'is-ok':'is-ng'}"><div class="bq-verdict">${q.checked?'正解':'正しい語順'}</div><div class="bq-answer"><span class="bq-ans-th">${q.tokens.map(t=>esc(t.th)).join(' ')}</span><button class="speak is-icon" onclick="speakThaiText(build.items[build.k].e.th)" aria-label="文を再生" title="文を再生">${icon('audio')}</button></div><div class="bq-ans-ro">${esc(q.e.ro)}</div><div class="bq-gloss">${q.tokens.map(t=>`<span><b>${esc(t.th)}</b>${esc(t.mean)}</span>`).join('')}</div>${q.e.note?`<p class="bq-note">${esc(q.e.note)}</p>`:''}</div>`:'';
 return `<section class="bq"><div class="bq-top"><button class="textbtn" onclick="buildExit()">← 終了する</button><span>${build.k+1} / ${n}</span><span class="bq-mode">並べ替え</span></div><div class="progress bq-progress"><span style="width:${build.k/n*100}%"></span></div>
 <div class="bq-card"><div class="bq-from">${esc(displayNumber(q.id))} ${esc(q.l.title)}</div><p class="bq-ja">${esc(q.e.ja)}</p>
 <button class="textbtn bq-hint-btn" onclick="build.hint=!build.hint;renderBuild()">${build.hint?'ヒントを隠す':'ヒント：文の形'}</button>${build.hint?`<div class="bq-hint">${esc(q.l.pattern)}</div>`:''}
 <div class="bq-line ${done?(q.checked?'is-ok':'is-ng'):''}" aria-live="polite">${line}</div>
 <div class="bq-count">${q.picked.length} / ${need}語${q.chips.length>need?` · 使わない語が${q.chips.length-need}つ混ざっています`:''}</div>
 <div class="bq-bank">${bank}</div>
 ${result}
 <div class="bq-actions">${done?`${q.checked?'':`<button class="btn light" onclick="buildReset()">もう一度並べる</button>`}<button class="btn" onclick="buildNext()">${build.k<n-1?'次へ →':'結果を見る'}</button>`:`<button class="btn light" onclick="buildReset()" ${q.picked.length?'':'disabled'}>やり直す</button><button class="btn" onclick="buildCheck()" ${q.picked.length?'':'disabled'}>答え合わせ</button>`}</div>
 <div class="bq-opts"><label><input type="checkbox" ${state.buildRo===false?'':'checked'} onchange="state.buildRo=this.checked;save();renderBuild()"> 読みを表示</label><label><input type="checkbox" ${state.buildSound===false?'':'checked'} onchange="state.buildSound=this.checked;save()"> タップで発音</label></div></div></section>`}
