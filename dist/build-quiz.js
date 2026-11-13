// 文法の確認テスト＝並べ替え問題。日本語文を見て、バラバラのタイ語を順にタップして文を組み立てる。
// 問題は dist/reorder-items.js（scripts/build-reorder.cjs で例文と確認問題から作成）。キーは従来どおり "課ID:番号"（state.missed と互換）。
let build=null,buildSel=null;
const BUILD_LEVELS=[
 {id:1,name:'やさしい',desc:'2〜3語・余分な語1つ',min:2,max:3,extra:1},
 {id:2,name:'ふつう',desc:'3〜5語・余分な語1つ',min:3,max:5,extra:1},
 {id:3,name:'むずかしい',desc:'5〜7語・余分な語2つ・語を細かく分割',min:5,max:7,extra:2,fine:true},
 {id:4,name:'上級',desc:'7語以上・余分な語3つ・読みなし',min:7,max:99,extra:3,fine:true,noRo:true}];
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
function buildMake(key,lv){const x=quizItem(key),it=reorderItems(x.id)[x.k];if(!it)return null;const l=lessons[x.id-1],tokens=buildToks(it,lv),extra=buildDistractors(x.id,tokens,lv?lv.extra:(tokens.length>=5?2:1));
 let chips=shuffle([...tokens.map((t,k)=>({...t,k})),...extra.map(t=>({...t,k:-1}))]);
 if(chips.filter(c=>c.k>=0).every((c,n,a)=>n===0||a[n-1].k<c.k))chips.reverse();// 正解の並びのままにしない
 return {key:x.key,id:x.id,k:x.k,l,it,tokens,chips,picked:[],checked:null}}
function startReorder(keys,origin,opts={}){withReorder(()=>{const lv=opts.level?buildLevel(opts.level):null,items=keys.map(k=>buildMake(k,lv)).filter(Boolean);if(!items.length){toast('この条件の問題がありません。');return}
 build={origin,title:opts.title||'',lessonId:opts.lessonId||null,level:lv,keys:items.map(q=>q.key),items,k:0,results:[],hint:false,opts};quiz=null;view='build';render();window.scrollTo(0,0)})}
// 課の確認テスト：その課の問題から10問。全問正解で履修済み。
function startLessonTest(id){withReorder(()=>{const keys=shuffle(reorderItems(id).map((_,k)=>`${id}:${k}`)).slice(0,10);startReorder(keys,'lesson',{lessonId:id,title:`${displayNumber(id)} ${lessons[id-1].title}`})})}
// 範囲・難易度を選ぶ画面
function openBuildSetup(){build=null;quiz=null;view='build';render();window.scrollTo(0,0);withReorder(()=>{if(view==='build'&&!build)render()})}
function buildSelected(){if(!buildSel){const saved=Array.isArray(state.buildRange)?state.buildRange.filter(id=>lessons[id-1]):[];buildSel=new Set(saved.length?saved:(state.done.length?state.done:orderedLessons.slice(0,6).map(l=>l.id)))}return buildSel}
function buildToggleLesson(id){const s=buildSelected();s.has(id)?s.delete(id):s.add(id);buildSaveSel()}
function buildToggleChapter(m){const s=buildSelected(),ids=lessons.filter(l=>l.m===m).map(l=>l.id),all=ids.every(id=>s.has(id));ids.forEach(id=>all?s.delete(id):s.add(id));buildSaveSel()}
function buildSetAll(mode){const s=buildSelected();s.clear();(mode==='done'?state.done:mode==='all'?lessons.map(l=>l.id):[]).forEach(id=>s.add(id));buildSaveSel()}
function buildSaveSel(){state.buildRange=[...buildSelected()];save();render()}
function buildCandidates(lv){const out=[];for(const id of buildSelected())reorderItems(id).forEach((it,k)=>{if(buildFits(it,lv))out.push(`${id}:${k}`)});return out}
function startFreeBuild(){withReorder(()=>{const lv=buildLevel(state.buildLevel||2),c=buildCandidates(lv);if(!c.length){toast('この範囲と難易度に合う問題がありません。範囲を広げるか難易度を変えてください。');return}startReorder(shuffle(c).slice(0,state.buildCount||10),'free',{level:lv.id,title:'並べ替え練習'})})}
function buildSetupView(){const sel=buildSelected(),ready=reorderReady(),lv=buildLevel(state.buildLevel||2),avail=ready?buildCandidates(lv).length:0,miss=state.missed.length;
 const chapters=modules.map((m,i)=>{const ls=lessons.filter(l=>l.m===i),n=ls.filter(l=>sel.has(l.id)).length;return `<details class="bq-ch"${n&&n<ls.length?' open':''}><summary><label onclick="event.stopPropagation()"><input type="checkbox" ${n===ls.length?'checked':''} onchange="buildToggleChapter(${i})"> ${i+1}. ${esc(m.name)}</label><span>${n}/${ls.length}</span></summary><div class="bq-ls">${ls.map(l=>`<label><input type="checkbox" ${sel.has(l.id)?'checked':''} onchange="buildToggleLesson(${l.id})"><span class="bq-ln">${displayNumber(l.id)}</span>${esc(l.title)}${state.done.includes(l.id)?'<em>✓</em>':''}</label>`).join('')}</div></details>`}).join('');
 return `<button class="textbtn back" onclick="go('course')">← 文法に戻る</button><section class="bq bq-setup"><h1>並べ替え練習</h1><p class="bq-lead">日本語の文に合うように、バラバラのタイ語を左から順に並べます。範囲と難易度を選んでください。</p>
 <div class="bq-sec"><div class="bq-sec-h"><h2>難易度</h2></div><div class="bq-levels">${BUILD_LEVELS.map(x=>`<button class="bq-lv${x.id===lv.id?' is-on':''}" aria-pressed="${x.id===lv.id}" onclick="state.buildLevel=${x.id};save();render()"><b>${'★'.repeat(x.id)}<span>${'☆'.repeat(4-x.id)}</span> ${x.name}</b><small>${x.desc}</small></button>`).join('')}</div></div>
 <div class="bq-sec"><div class="bq-sec-h"><h2>出題範囲</h2><span>${sel.size}課を選択中</span></div><div class="bq-quick"><button onclick="buildSetAll('done')" ${state.done.length?'':'disabled'}>履修済みの課（${state.done.length}）</button><button onclick="buildSetAll('all')">すべての課</button><button onclick="buildSetAll('none')">選択を解除</button></div><div class="bq-chs">${chapters}</div></div>
 <div class="bq-sec bq-start"><label>問題数 <select class="field" onchange="state.buildCount=Number(this.value);save()">${[5,10,20].map(n=>`<option value="${n}" ${(state.buildCount||10)===n?'selected':''}>${n}問</option>`).join('')}</select></label><span class="bq-avail">${ready?(avail?`この条件で出せる文：${avail}`:'この範囲にはこの難易度の文がありません。範囲を広げてください'):'問題を読み込んでいます…'}</span><button class="btn" onclick="startFreeBuild()" ${ready&&avail?'':'disabled'}>はじめる →</button></div>
 ${miss?`<div class="bq-sec bq-missed"><span>間違えた問題が${miss}問あります</span><button class="btn light" onclick="startQuiz([...state.missed],'review')">間違えた問題を解く</button></div>`:''}</section>`}
function buildCur(){return build.items[build.k]}
function buildPick(n){const q=buildCur();if(q.checked!==null||q.picked.includes(n))return;q.picked.push(n);if(state.buildSound!==false)speakThaiText(q.chips[n].th,false,true);renderBuild()}
function buildUnpick(pos){const q=buildCur();if(q.checked!==null)return;q.picked.splice(pos,1);renderBuild()}
function buildReset(){const q=buildCur();q.picked=[];q.checked=null;renderBuild()}
function buildCheck(){const q=buildCur();if(!q.picked.length||q.checked!==null)return;const got=q.picked.map(n=>q.chips[n].th).join(''),want=q.tokens.map(t=>t.th).join('');q.checked=got===want;
 if(build.results[build.k]===undefined){build.results[build.k]=q.checked;
  if(q.checked)state.missed=state.missed.filter(x=>x!==q.key);else if(!state.missed.includes(q.key))state.missed.push(q.key);
  if(build.origin==='lesson'&&build.results.filter(r=>r!==undefined).length===build.items.length){const id=build.lessonId;if(build.results.every(Boolean)){if(!state.done.includes(id))state.done.push(id);if(!state.passed.includes(id))state.passed.push(id);build.completed=true}else state.passed=state.passed.filter(x=>x!==id)}
  if(typeof syncWrong==='function')syncWrong();save()}
 speakThaiText(q.it.th,false,true);renderBuild()}
function buildNext(){build.k=Math.min(build.k+1,build.items.length);renderBuild();window.scrollTo(0,0)}
function buildRetryWrong(){const wrong=build.items.filter((q,n)=>!build.results[n]).map(q=>q.key);if(!wrong.length)return;startReorder(wrong,build.origin==='lesson'?'review':build.origin,{...build.opts,lessonId:null})}
function buildAgain(){const b=build;if(b.origin==='lesson')startLessonTest(b.lessonId);else if(b.origin==='free')startFreeBuild();else startReorder(shuffle([...b.keys]),b.origin,b.opts)}
function buildExit(){const b=build;build=null;if(b&&b.origin==='lesson'){current=b.lessonId;view='lesson';render();window.scrollTo(0,0)}else if(b&&b.origin==='free'){openBuildSetup()}else go(b&&b.origin==='review'?'review':'course')}
function renderBuild(){if(view!=='build')return;$('#main').innerHTML=buildView()}
function buildChip(c,attrs,cls=''){const ro=state.buildRo!==false&&!(build&&build.level&&build.level.noRo);return `<button class="bq-chip ${cls}" ${attrs}><span class="bq-th">${esc(c.th)}</span>${ro?`<span class="bq-ro">${esc(c.ro)}</span>`:''}</button>`}
function buildView(){if(!build)return buildSetupView();const n=build.items.length,lv=build.level;
 if(build.k>=n){const ok=build.results.filter(Boolean).length,lessonRun=build.origin==='lesson';return `<section class="bq"><div class="bq-top"><button class="textbtn" onclick="buildExit()">← 終了する</button><span>${lessonRun?'確認テスト':'並べ替え練習'}</span></div><div class="bq-done${lessonRun&&build.completed?' is-complete':''}"><div class="bq-score">${ok} / ${n}</div><p>${lessonRun?(ok===n?'全問正解！この課を履修済みにしました。':`全${n}問正解で履修済みになります。間違えた問題は「復習」に残ります。`):(ok===n?'全問正解です。語順が身についています。':'間違えた問題は「復習」に残ります。もう一度並べて語順を確かめましょう。')}</p><div class="bq-actions">${ok<n?`<button class="btn" onclick="buildRetryWrong()">間違えた問題をもう一度</button>`:''}<button class="btn light" onclick="buildAgain()">${lessonRun?'もう一度テスト':'別の問題で練習'}</button>${lessonRun&&build.completed&&orderedLessons.findIndex(l=>l.id===build.lessonId)<orderedLessons.length-1?`<button class="btn light" onclick="current=${build.lessonId};build=null;moveLesson(1)">次の課へ →</button>`:''}<button class="btn light" onclick="buildExit()">戻る</button></div></div></section>`}
 const q=buildCur(),done=q.checked!==null,need=q.tokens.length,showRo=state.buildRo!==false&&!(lv&&lv.noRo);
 const line=q.picked.length?q.picked.map((c,pos)=>buildChip(q.chips[c],done?'disabled':`onclick="buildUnpick(${pos})" aria-label="${esc(q.chips[c].th)} を外す"`,'is-placed')).join(''):`<span class="bq-placeholder">下の語をタップして、左から順に並べます</span>`;
 const bank=q.chips.map((c,k)=>q.picked.includes(k)?`<span class="bq-chip is-ghost" aria-hidden="true"><span class="bq-th">${esc(c.th)}</span>${showRo?`<span class="bq-ro">${esc(c.ro)}</span>`:''}</span>`:buildChip(c,done?'disabled':`onclick="buildPick(${k})"`)).join('');
 const result=done?`<div class="bq-result ${q.checked?'is-ok':'is-ng'}"><div class="bq-verdict">${q.checked?'正解':'正しい語順'}</div><div class="bq-answer"><span class="bq-ans-th">${q.tokens.map(t=>esc(t.th)).join(' ')}</span><button class="speak is-icon" onclick="speakThaiText(build.items[build.k].it.th)" aria-label="文を再生" title="文を再生">${icon('audio')}</button></div><div class="bq-ans-ro">${esc(q.it.ro)}</div><div class="bq-gloss">${q.tokens.map(t=>`<span><b>${esc(t.th)}</b>${esc(t.mean)}</span>`).join('')}</div>${q.it.why?`<p class="bq-note">${esc(q.it.why)}</p>`:''}</div>`:'';
 const mode=build.origin==='lesson'?'確認テスト':lv?`${'★'.repeat(lv.id)} ${lv.name}`:'並べ替え';
 return `<section class="bq"><div class="bq-top"><button class="textbtn" onclick="buildExit()">← 終了する</button><span>${build.k+1} / ${n}</span><span class="bq-mode">${mode}</span></div><div class="progress bq-progress"><span style="width:${build.k/n*100}%"></span></div>
 <div class="bq-card"><div class="bq-from">${esc(displayNumber(q.id))} ${esc(q.l.title)}</div><p class="bq-ja">${esc(q.it.ja)}</p>
 <button class="textbtn bq-hint-btn" onclick="build.hint=!build.hint;renderBuild()">${build.hint?'ヒントを隠す':'ヒント：文の形'}</button>${build.hint?`<div class="bq-hint">${esc(q.l.pattern)}</div>`:''}
 <div class="bq-line ${done?(q.checked?'is-ok':'is-ng'):''}" aria-live="polite">${line}</div>
 <div class="bq-count">${q.picked.length} / ${need}語${q.chips.length>need?` · 使わない語が${q.chips.length-need}つ混ざっています`:''}</div>
 <div class="bq-bank">${bank}</div>
 ${result}
 <div class="bq-actions">${done?`${q.checked?'':`<button class="btn light" onclick="buildReset()">もう一度並べる</button>`}<button class="btn" onclick="buildNext()">${build.k<n-1?'次へ →':'結果を見る'}</button>`:`<button class="btn light" onclick="buildReset()" ${q.picked.length?'':'disabled'}>やり直す</button><button class="btn" onclick="buildCheck()" ${q.picked.length?'':'disabled'}>答え合わせ</button>`}</div>
 <div class="bq-opts">${lv&&lv.noRo?'<span>上級は読みを表示しません</span>':`<label><input type="checkbox" ${state.buildRo===false?'':'checked'} onchange="state.buildRo=this.checked;save();renderBuild()"> 読みを表示</label>`}<label><input type="checkbox" ${state.buildSound===false?'':'checked'} onchange="state.buildSound=this.checked;save()"> タップで発音</label></div></div></section>`}
