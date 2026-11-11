// 文字ゲーム: questions use only taught letters, never offer two right answers, tones come from the data,
// best scores survive save/import sanitizing, and timers stop when the learner leaves the game view.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
function makeCtx(store={}){
 const live=new Map;let seq=0;
 const timers={live,set:(fn,ms,rep)=>{const id=++seq;live.set(id,{fn,rep});return id},clear:id=>{live.delete(id)},
  // Fire every pending callback once (intervals stay registered, timeouts are removed).
  flush(){for(const [id,t] of [...live]){if(!live.has(id))continue;if(!t.rep)live.delete(id);t.fn()}}};
 const els={};const el=s=>els[s]||(els[s]={innerHTML:'',textContent:'',style:{display:''},value:''});
 const ctx={console,store,timers,
  window:{scrollTo(){},speechSynthesis:{getVoices:()=>[{lang:'th-TH',voiceURI:'th'}],cancel(){},speak(){},addEventListener(){}}},
  SpeechSynthesisUtterance:function(t){this.text=t},
  location:{hash:''},localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)}},
  setTimeout:(f,ms)=>timers.set(f,ms,false),clearTimeout:id=>timers.clear(id),setInterval:(f,ms)=>timers.set(f,ms,true),clearInterval:id=>timers.clear(id),
  Date,Math,confirm:()=>true,
  document:{querySelector:el,getElementById:()=>null,addEventListener(){},createElement:()=>({click(){}}),title:''}};
 ctx.speechSynthesis=ctx.window.speechSynthesis;
 vm.createContext(ctx);
 // Production order: script-game.js right after script-app.js, before app.js.
 for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','word-topics','words-app','script-data','script-app','script-game','lesson-quizzes'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx,{filename:n+'.js'});
 vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
 vm.runInContext(`var annotateCalls=[];annotateReadings=function(r){annotateCalls.push(view)};var renderCount=0;const _render=render;render=function(){renderCount++;return _render()};toast=()=>{};
 this.t={D:SCRIPT_DATA,scriptLessons,scriptNext,sgLessons,sgLetters,sgToneItems,sgAvailability,sgSpeedQuestion,sgListenQuestion,sgToneQuestion,sgMatchBoard,startScriptGame,scriptGameAnswer,scriptGameTap,openScriptGame,scriptGameView,scriptView,sanitizeScriptGames,importData,saveScript,go,sgTick,
  st:()=>scriptState,setDone:d=>{scriptState.done=d},game:()=>sgGame,view:()=>view,renders:()=>renderCount,annotated:()=>annotateCalls,sgTimer:()=>sgTimer,sgWait:()=>sgWait,main:()=>document.querySelector('#main').innerHTML}`,ctx);
 return ctx}
const ctx=makeCtx(),t=ctx.t,ls=t.scriptLessons(),cons=Object.fromEntries(t.D.consonants.map(c=>[c.ch,c]));
const sound=ch=>cons[ch].initial;
const TONES=['mid','low','falling','high','rising'];
// Every lesson prefix (done = s01…s(i), so the learner is on lesson i+1) plus a non-contiguous record with a stale id.
const states=[...ls.map((l,i)=>ls.slice(0,i).map(x=>x.id)),['s01','s05','s09','s13','zz99'],ls.map(l=>l.id)];
let checked={speed:0,listen:0,tone:0,match:0},unlocked=new Set;
for(const done of states){t.setDone(done);const next=t.scriptNext(),inPlay=ls.filter(l=>done.includes(l.id)||l.id===next.id);
 const taught=new Set(inPlay.flatMap(l=>l.newConsonants||[])),readings=inPlay.flatMap(l=>l.readings||[]);
 assert.deepEqual(t.sgLessons().map(l=>l.id),inPlay.map(l=>l.id));
 const letters=t.sgLetters();for(const c of letters)assert(taught.has(c.ch),`${c.ch} not taught`);
 const nSounds=new Set(letters.map(c=>c.initial)).size;
 for(const m of ['speed','listen','match'])assert.equal(t.sgAvailability(m).ok,nSounds>=4,`${m} lock with ${nSounds} sounds`);
 if(nSounds>=4){for(const m of ['speed','listen','match'])unlocked.add(m);
  for(let k=0;k<60;k++){
   const q=t.sgSpeedQuestion(letters,null);assert(taught.has(q.target.ch));assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4,'speed options share a sound');
   assert.equal(q.options.filter(o=>o===q.target.initial).length,1);assert.equal(q.answer,q.target.initial);
   const ownSounds=new Set(letters.map(c=>c.initial));for(const o of q.options)assert(ownSounds.has(o),`sound ${o} not from a taught letter`);
   const lq=t.sgListenQuestion(letters,null);assert.equal(lq.options.length,4);for(const o of lq.options)assert(taught.has(o),`listen option ${o} not taught`);
   assert.equal(new Set(lq.options.map(sound)).size,4,'listen options share a sound');assert.equal(lq.answer,lq.target.ch);assert(lq.options.includes(lq.answer));assert.equal(lq.speak,cons[lq.answer].name);
   const b=t.sgMatchBoard(letters),L=b.filter(x=>x.side==='letter'),S=b.filter(x=>x.side==='sound');assert.equal(L.length,Math.min(6,nSounds));assert.equal(S.length,L.length);
   assert.equal(new Set(L.map(x=>x.key)).size,L.length,'board sounds repeat');for(const x of L){assert(taught.has(x.ch));assert.equal(x.key,sound(x.ch))}
   assert.deepEqual(S.map(x=>x.key).sort(),L.map(x=>x.key).sort());checked.speed++;checked.listen++;checked.match++}}
 const items=t.sgToneItems();
 for(const r of items){assert(readings.includes(r),'tone item not from a lesson in play');assert(TONES.includes(r.tone));assert(!/\s/.test(r.th)&&!/\s/.test(r.ro.trim()),'not one syllable');assert(!/[๐-๙]/.test(r.th))}
 const tones=new Set(items.map(r=>r.tone));assert.equal(t.sgAvailability('tone').ok,items.length>=4&&tones.size>=2);
 if(t.sgAvailability('tone').ok){unlocked.add('tone');for(let k=0;k<40;k++){const q=t.sgToneQuestion(items,null);const src=readings.find(r=>r.th===q.target.th);assert.equal(q.answer,src.tone,'tone must be the data tone');assert.deepEqual([...q.options].sort(),[...TONES].sort());checked.tone++}}}
assert.equal(unlocked.size,4);
// A fresh learner (s01 only: ก ด ต) has every mode locked.
t.setDone([]);for(const m of ['speed','listen','tone','match'])assert(!t.sgAvailability(m).ok,m+' should be locked at s01');
assert(t.scriptView().includes('文字ゲーム'));

// Best scores: sanitize drops junk, keeps valid numbers, and survive save → reload and export → import.
const S=t.sanitizeScriptGames;
assert.deepEqual(JSON.parse(JSON.stringify(S(JSON.parse('{"speed":{"best":1e999},"listen":{"best":-5},"tone":{"best":"80"},"match":{"bestTime":0},"x":{"best":3}}')))),{});
assert.deepEqual(JSON.parse(JSON.stringify(S({speed:{best:120},listen:{best:{}},tone:{best:40.4},match:{bestTime:12.34}}))),{speed:{best:120},tone:{best:40},match:{bestTime:12.3}});
assert.deepEqual(JSON.parse(JSON.stringify(S(null))),{});assert.deepEqual(JSON.parse(JSON.stringify(S([1]))),{});assert.deepEqual(JSON.parse(JSON.stringify(S({match:{bestTime:99999}}))),{});
const store2={'thai-steps-script-v1':JSON.stringify({done:['s01','s02'],games:{speed:{best:230},listen:{best:Infinity},tone:{best:90},match:{bestTime:17.5}}})};
const ctx2=makeCtx(store2);assert.deepEqual(JSON.parse(JSON.stringify(ctx2.t.st())),{done:['s01','s02'],games:{speed:{best:230},tone:{best:90},match:{bestTime:17.5}}});
ctx2.t.saveScript();const ctx3=makeCtx({...store2});assert.deepEqual(JSON.parse(JSON.stringify(ctx3.t.st().games)),{speed:{best:230},tone:{best:90},match:{bestTime:17.5}});
(async()=>{
 const backup={app:'thai-steps-v1',version:1,state:{done:[],saved:[],wrong:[],passed:[]},script:{done:['s01','s02',7],games:{speed:{best:310},listen:{best:'9e9'},tone:{best:55},match:{bestTime:-1}}}};
 const ctx4=makeCtx();await ctx4.t.importData({text:async()=>JSON.stringify(backup)});
 assert.deepEqual(JSON.parse(JSON.stringify(ctx4.t.st())),{done:['s01','s02'],games:{speed:{best:310},tone:{best:55}}});
 const ctx5=makeCtx({...ctx4.store});assert.deepEqual(JSON.parse(JSON.stringify(ctx5.t.st().games)),{speed:{best:310},tone:{best:55}});

 // Timers: a run starts one interval; leaving mid-feedback clears it and the feedback timeout, and nothing renders later.
 const g=makeCtx(),T=g.t,live=g.timers.live;T.setDone(ls.slice(0,8).map(l=>l.id));
 T.startScriptGame('speed');assert.equal(T.view(),'scriptGame');assert.equal(live.size,1);assert(T.main().includes('sg-root'));
 const q=T.game().q;T.scriptGameAnswer(q.options.indexOf(q.answer));assert.equal(T.game().score,10);assert.equal(T.game().combo,1);assert.equal(live.size,2,'interval + feedback timeout');
 T.go('home');assert.equal(live.size,0,'timers left after leaving');assert.equal(T.sgTimer(),null);assert.equal(T.sgWait(),null);
 const r0=T.renders();g.timers.flush();T.sgTick(T.game());assert.equal(T.renders(),r0,'render after leaving');
 // Also via the sidebar path (view=...;render()), which bypasses go().
 T.startScriptGame('listen');assert.equal(live.size,1);vm.runInContext("view='settings';render()",g);assert.equal(live.size,0);
 // Restarting never stacks intervals; the clock running out finishes, saves the best and clears everything.
 T.startScriptGame('speed');T.startScriptGame('speed');assert.equal(live.size,1);
 for(let k=0;k<6;k++){const qq=T.game().q;T.scriptGameAnswer(qq.options.indexOf(qq.answer));g.timers.flush()}
 assert.equal(T.game().combo,6);assert.equal(T.game().score,10*4+20*2);
 T.game().deadline=Date.now()-1;g.timers.flush();assert.equal(T.game().phase,'end');assert.equal(live.size,0);
 assert.equal(T.st().games.speed.best,80);assert.equal(JSON.parse(g.store['thai-steps-script-v1']).games.speed.best,80);assert(T.main().includes('もう一度'));
 // A wrong answer resets the combo and lands in the review list.
 T.startScriptGame('tone');const tq=T.game().q;T.scriptGameAnswer(tq.options.findIndex(o=>o!==tq.answer));assert.equal(T.game().combo,0);assert.equal(T.game().missed[0].th,tq.target.th);
 T.game().deadline=Date.now()-1;g.timers.flush();assert(T.main().includes(tq.target.th));assert.equal(live.size,0);
 // Match: pair every letter with its sound, then the time is recorded and timers stop.
 T.startScriptGame('match');const tiles=T.game().tiles;assert.equal(live.size,1);
 const L=tiles.filter(x=>x.side==='letter'),Sd=tiles.filter(x=>x.side==='sound');const wrong=Sd.find(s=>s.key!==L[0].key);
 T.scriptGameTap(L[0].i);T.scriptGameTap(wrong.i);assert.equal(T.game().mismatches,1);assert.equal(live.size,2);g.timers.flush();assert.equal(T.game().open.length,0);
 for(const x of L){T.scriptGameTap(x.i);T.scriptGameTap(Sd.find(s=>s.key===x.key).i)}
 assert.equal(T.game().phase,'end');assert.equal(live.size,0);assert(T.st().games.match.bestTime>0);assert(T.main().includes(L[0].ch));
 // romanized readings are never injected into the game view.
 assert(!T.annotated().includes('scriptGame'));
 T.openScriptGame();assert(T.main().includes('スピード読み')&&T.main().includes('ペアそろえ'));assert.equal(live.size,0);
 console.log(`PASS: script game — ${states.length} learner states, ${checked.speed} speed / ${checked.listen} listen / ${checked.tone} tone / ${checked.match} match draws, one right answer each, taught letters only, data tones, sanitized bests, timers cleared on leave.`);
})().catch(e=>{console.error(e);process.exitCode=1});
