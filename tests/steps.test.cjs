const fs=require('fs'),vm=require('vm'),assert=require('assert');
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const store={};const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({})},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},Date,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};this.t={startGuidedStep,answerStepTask,nextStepTask,stepSessionView,getStep:()=>stepSession,wordRec,loadWordBank,stepOrder,nextStepWords,stepNumber,startStep,answerWord,nextWordQuestion,wordSessionView,stepPanel,stepsToday,sanitizeWordState,setLevel:setWordLevel,getState:()=>wordState,getSession:()=>wordSession,home}",ctx);
(async()=>{const t=ctx.t;await t.loadWordBank();
const order=t.stepOrder();assert(order.length>7000);assert(order.every((w,i)=>w.studyRank===i+1));assert(order.every(w=>w.collection!=='slang'));
// Step 1 = the 10 most frequent general words.
assert.equal(t.stepNumber(),1);const first=t.nextStepWords().map(w=>w.id);assert.equal(first.length,10);assert.deepStrictEqual(first,order.slice(0,10).map(w=>w.id));
assert(t.stepPanel().includes('次のステップ 1'));
const run=miss=>{t.startStep('quiz');const s=t.getSession();for(let i=0;i<s.ids.length;i++){const id=s.ids[i];const wrong=s.choices.find(c=>c!==id);t.answerWord(i===miss?wrong:id);t.nextWordQuestion()}return t.wordSessionView()};
// One miss: same step again.
let html=run(0);assert(html.includes('全問正解でステップ 1'));assert.equal(t.getState().stepWords,0);
// Full marks: next step, today's count and streak recorded, saved under the existing words key.
html=run(-1);assert(html.includes('ステップ 1 クリア'));assert.equal(t.getState().stepWords,10);assert.equal(t.stepsToday(),1);assert.equal(t.getState().streak.days,1);
assert.equal(t.stepNumber(),2);assert.deepStrictEqual(t.nextStepWords().map(w=>w.id),order.slice(10,20).map(w=>w.id));
const saved=JSON.parse(store['thai-steps-words-v1']);assert.equal(saved.stepWords,10);assert(t.stepPanel().includes('今日の分は完了'));
// Backups keep step progress; bad values are dropped.
const s=t.sanitizeWordState({records:{},stepWords:30,stepsPerDay:2,today:{date:'2026-11-11',steps:1},streak:{last:'x',days:5}});assert.equal(s.stepWords,30);assert.equal(s.stepsPerDay,2);assert.equal(s.streak.last,'');
// Guided step: new words are shown, recalled both ways; a miss comes back later in the session and the word is reviewed soon.
t.getState().stepWords=10;t.startGuidedStep();let g=t.getStep();const n0=g.tasks.length;assert(g.tasks.some(x=>x.type==='learn')&&g.tasks.some(x=>x.type==='recall')&&g.tasks.some(x=>x.type==='produce'));
let missedId=null;for(let k=0;k<200&&!g.done;k++){const task=g.tasks[g.i];if(task.type!=='learn'){if(!missedId&&task.type==='recall'){missedId=task.id;t.answerStepTask(g.choices.find(c=>c!==task.id))}else t.answerStepTask(task.id)}t.nextStepTask()}
assert(g.done);assert.equal(g.tasks.length,n0+1);assert.equal(t.getState().stepWords,20);assert.equal(t.wordRec(missedId).stage,0);
const okId=g.news.find(id=>id!==missedId);assert.equal(t.wordRec(okId).stage,1);assert(t.wordRec(okId).due>Date.now()+20*3600000);assert(t.stepSessionView().includes('ステップ 2 完了'));
// A 500-word range ends after 50 steps.
t.setLevel(500);t.getState().stepWords=500;assert(t.stepPanel().includes('この範囲は完了'));
console.log('PASS: word steps — frequency order, 10 words per step, full marks advance, daily count and streak, backup-safe state; guided step with both-direction recall, in-session relearning and spaced follow-up.');})().catch(e=>{console.error(e);process.exit(1)});
