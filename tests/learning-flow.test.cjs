const fs=require('fs'),vm=require('vm'),assert=require('assert');
// Learning flow: 学習順 list order, quiz distractors, review continue without repeats, meanings before 成り立ち,
// the example after a wrong answer, and 復習する単語をリセット.
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json','sense-examples.json','slang-examples.json','example-senses.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const store={'thai-steps-words-v1':'{"records":{},"level":500}'};
const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({style:{}})},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},Date,Math,setTimeout:()=>0,clearTimeout(){},confirm:()=>true,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};this.t={loadWordBank,loadSenseExamples,stepOrder,selectedWords,makeWordQuestion,wordDetail,wordSessionView,stepSessionView,startWords,startWordReview,startGuidedStep,answerWord,answerStepTask,nextStepTask,revealWordCard,assessCard,exitWordSession,reviewDueWords,resetReviewWords,applyWordResult,dueWord,wordRec,saveWords,topicWord,go,review,nav,home,wordsView,getBank:()=>bank,getMap:()=>bankMap,getState:()=>wordState,getSession:()=>wordSession,getStep:()=>stepSession,setSort:x=>wordSort=x,getSort:()=>wordSort,setDeck:d=>wordDeck=d,setCurrent:id=>wordCurrent=id,setMode:m=>wordQuizMode=m,isPhrase,senseStatus:()=>senseExamplesStatus,senseEx:()=>senseExamples}",ctx);
(async()=>{const t=ctx.t;await t.loadWordBank();await t.loadSenseExamples();assert.equal(t.senseStatus(),'ready');
// ---- 学習順: the default sort of the general deck, in studyRank order (the order of the steps); not offered for slang/phrases.
assert.equal(t.getSort(),'study');t.setDeck('general');
let xs=t.selectedWords();const ranked=xs.filter(w=>w.studyRank);assert(ranked.length>=490);
assert.deepStrictEqual(ranked.map(w=>w.id),t.stepOrder().filter(w=>ranked.some(x=>x.id===w.id)).map(w=>w.id));
assert(xs.slice(0,ranked.length).every(w=>w.studyRank),'ranked words come first');
for(let i=1;i<ranked.length;i++)assert(ranked[i-1].studyRank<ranked[i].studyRank);
assert.deepStrictEqual(xs.slice(0,5).map(w=>w.id),t.stepOrder().slice(0,5).map(w=>w.id));
let html=t.wordsView();assert(/<option value="study" selected>学習順<\/option>/.test(html),'学習順 is the first, selected option');
assert(html.indexOf('value="study"')<html.indexOf('value="frequency-desc"'));
t.setDeck('slang');html=t.wordsView();assert(!html.includes('value="study"'));assert(/<option value="frequency-desc" selected>/.test(html));
xs=t.selectedWords();assert(xs.every((w,i)=>i===0||xs[i-1].frequency>=w.frequency),'slang falls back to 頻度：高い順');
t.setDeck('general');
// ---- Distractors over all 入門 words (three draws each): same part of speech, no reverse synonyms, no nested glosses.
const map=t.getMap(),intro=t.stepOrder().filter(w=>w.studyRank<=500&&w.meanings[0].checked);assert(intro.length>=400);
let total=0,samePos=0;const bare=s=>s.replace(/[、,・;；。\s〜…~]/g,'');
for(let rep=0;rep<3;rep++)for(const w0 of intro){const w=t.topicWord(w0),q=t.makeWordQuestion(w0);assert.equal(q.length,4);assert(q.includes(w.id));total++;
 const ds=q.filter(id=>id!==w.id).map(id=>t.topicWord(map.get(id)));if(ds.some(d=>d.pos===w.pos))samePos++;
 for(const d of ds){assert(!(d.relations.syn||[]).includes(w.id)&&!(d.relations.similar||[]).includes(w.id),`${d.th} lists ${w.th} as a synonym`);
  const a=bare(d.meanings[0].ja),b=bare(w.meanings[0].ja),[s,l]=a.length<b.length?[a,b]:[b,a];assert(!(s.length>=2&&l.includes(s)),`nested gloss ${w.th} / ${d.th}`)}}
assert(samePos/total>=0.97,`same-POS share ${samePos}/${total}`);
// ---- Review: oldest due first, cards are not served twice in one visit, then the test takes over.
const now=Date.now(),pool=t.stepOrder().slice(0,25);
pool.forEach((w,i)=>t.getState().records[w.id]={...t.wordRec(w.id),seen:1,stage:1,due:now-86400000*(i+1)});
t.go('review');t.startWordReview('cards');let s=t.getSession();assert.equal(s.ids.length,20);
assert.deepStrictEqual([...s.ids],[...pool].reverse().slice(0,20).map(w=>w.id),'oldest due first');
const served=new Set(s.ids);for(let i=0;i<20;i++){t.revealWordCard();t.assessCard(true)}
html=t.wordSessionView();assert(!html.includes('復習時期を記録しました'));assert(html.includes('カードは確認用です'));
assert(html.includes('テストで仕上げる'));assert(html.includes("startWordReview('cards')")&&html.includes('続けて復習（残り 5語）'));
t.startWordReview('cards');s=t.getSession();assert.equal(s.ids.length,5);assert(s.ids.every(id=>!served.has(id)),'no card twice in one visit');
for(let i=0;i<5;i++){t.revealWordCard();t.assessCard(true)}
html=t.wordSessionView();assert(html.includes("startWordReview('quiz')")&&html.includes('テストで復習（残り 25語）'),'all shown: the test is offered');
assert(!html.includes("startWordReview('cards')"));
t.startWordReview('cards');assert.equal(t.getSession().kind,'quiz','cards give way to the test');
// opening 復習 again (also via 復習に戻る) clears the memory: カードで復習 shows cards again
t.exitWordSession();t.startWordReview('cards');assert.equal(t.getSession().kind,'cards');
t.go('home');t.go('review');t.startWordReview('cards');assert.equal(t.getSession().kind,'cards');
// cards from the list: a new word rated 思い出せた becomes due, but 続けて復習 does not replay it
t.go('review');t.go('words');for(const w of pool)t.getState().records[w.id]={...t.wordRec(w.id),due:now+86400000};const fresh=t.stepOrder().slice(40,50).map(w=>w.id);t.startWords('cards',fresh);for(let i=0;i<10;i++){t.revealWordCard();t.assessCard(true)}
assert(t.reviewDueWords().length>=10);html=t.wordSessionView();assert(!html.includes("startWordReview('cards')"),'no replay of the same cards');assert(html.includes("startWordReview('quiz')"));t.startWordReview('cards');assert.equal(t.getSession().kind,'quiz');
// a test session started from the list also offers the remaining reviews
t.go('words');t.startWords('quiz',[intro[0].id]);s=t.getSession();t.answerWord(s.ids[0]);s.i++;html=t.wordSessionView();assert(html.includes('続けて復習（残り'));
// ---- Word detail: meanings before 成り立ち.
const rotfai=t.getBank().find(w=>w.th==='รถไฟ');t.setCurrent(rotfai.id);t.go('words');t.setCurrent(rotfai.id);html=t.wordDetail();
assert(html.includes('成り立ち'));assert(html.indexOf('意味と使い方')<html.indexOf('成り立ち'));
// ---- Feedback: the example only after a wrong answer (quiz and step).
const kin=t.getBank().find(w=>w.th==='กิน'),ex=t.senseEx()[kin.id+'#'+kin.meanings[0].sourceSense];assert(ex);
t.setMode('th-ja');t.startWords('quiz',[kin.id]);t.answerWord(kin.id);html=t.wordSessionView();assert(html.includes('正解！'));assert(!html.includes('w-miss-ex'));
t.startWords('quiz',[kin.id]);s=t.getSession();t.answerWord(s.choices.find(c=>c!==kin.id));html=t.wordSessionView();assert(html.includes('w-miss-ex')&&html.includes(ex.th)&&html.includes(ex.ja));
t.go('words');t.getState().records={};t.startGuidedStep();let st=t.getStep();let g=0;while(st.tasks[st.i].type!=='recall'&&g++<80)t.nextStepTask();
const task=st.tasks[st.i],tw=t.topicWord(map.get(task.id)),tex=t.senseEx()[tw.id+'#'+tw.meanings[0].sourceSense];
t.answerStepTask(task.id);html=t.stepSessionView();assert(!html.includes('w-miss-ex'));
st.answered=null;st.i++;st.tasks.splice(st.i,0,{...task});st.choices=t.makeWordQuestion(tw);t.answerStepTask(st.choices.find(c=>c!==task.id));html=t.stepSessionView();
assert(html.includes('w-miss-ex')&&(!tex||html.includes(tex.th)));
// ---- 復習する単語をリセット: every due word (manual, wrong, phrase) leaves the queue; records and favourites stay.
t.getState().records={};const gen=t.stepOrder(),phrase=t.getBank().find(w=>t.isPhrase(w)&&w.meanings[0].checked);assert(phrase,'a phrase');
const ids=[gen[0].id,gen[1].id,gen[2].id];t.getState().records[ids[0]]={...t.wordRec(ids[0]),manual:true,favorite:true,favAt:123};
t.applyWordResult(ids[1],false);t.getState().records[ids[2]]={...t.wordRec(ids[2]),seen:3,correct:2,stage:2,due:now-1000};
const extra=[];if(phrase){t.applyWordResult(phrase.id,false);extra.push(phrase.id)}
const before=JSON.parse(JSON.stringify(t.getState().records)),hist=t.getState().history.length;
assert(t.reviewDueWords().length>=3);html=t.review();assert(html.includes('復習する単語をリセット'));
t.resetReviewWords();assert.equal(t.reviewDueWords().length,0);assert(!t.review().includes('復習する単語をリセット'));
for(const id of [...ids,...extra]){const a=before[id],b=t.wordRec(id);for(const k of ['seen','correct','wrong','lapses','stage','favorite','favAt'])assert.deepStrictEqual(b[k],a[k],k);assert.equal(b.manual,false);assert(Number.isFinite(b.due)&&b.due>now+59*86400000)}
assert.equal(t.getState().history.length,hist);assert(JSON.parse(store['thai-steps-words-v1']).records[ids[0]].due>now,'saved');
t.applyWordResult(ids[2],false);assert(t.dueWord(map.get(ids[2])),'a later wrong answer brings the word back');
console.log('PASS: 学習順 default, same-POS distractors '+(samePos/total*100).toFixed(1)+'%, review without repeats, meanings first, example after a miss, review reset.')})().catch(e=>{console.error(e);process.exit(1)});
