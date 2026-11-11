const fs=require('fs'),vm=require('vm'),assert=require('assert');
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const store={};const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({})},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},Date,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};this.t={slangTopics,PHRASE_SCENES,isPhrase,phraseScene,selectedWords,openWord,wordDetail,setPhrase:q=>{phraseQuery=q},getDeck:()=>wordDeck,setLevel:setWordLevel,TOPIC_ICONS,wordTopics,topicGrid,topicHub,topicStats,topicNextWords,startGuidedStep,answerStepTask,nextStepTask,stepSessionView,getStep:()=>stepSession,exitStepSession,wordRec,loadWordBank,setWordTopic,setWordDeck,getBank:()=>bank,getState:()=>wordState,sanitizeWordState,senses:WORD_TOPIC_SENSES,index:WORD_TOPIC_INDEX}",ctx);
(async()=>{const t=ctx.t;await t.loadWordBank();
// Every theme has its own pictogram, and all pictograms differ.
const ids=t.wordTopics().map(x=>x.id);assert.equal(ids.length,23);for(const id of ids)assert(t.TOPIC_ICONS[id],'missing pictogram '+id);assert.equal(new Set(ids.map(id=>t.TOPIC_ICONS[id])).size,23);
// Reviewed sense-level additions: basic domain words are in their theme whatever their displayed category.
{const inT=(th,topic,ja)=>t.getBank().some(w=>w.th===th&&w.collection!=='slang'&&t.index[w.id]?.includes(topic)&&(!ja||w.meanings.some(m=>t.senses[w.id][topic].includes(m.sourceSense)&&m.ja.includes(ja))));
 for(const [th,ja] of [['ชนะ','勝つ'],['แพ้','負け'],['คะแนน','得点'],['ประตู','ゴール'],['โยน','投げ'],['ขว้าง','投げ'],['ตี','打つ'],['เตะ','蹴'],['ซ้อม','練習'],['เสมอ','引き分け']])assert(inT(th,'sports',ja),'sports: '+th);
 assert(inT('ทำความสะอาด','home'));assert(inT('จาน','food'));assert(inT('ถอด','clothes'));assert(inT('ฟอลโลว์','tech'));assert(inT('เห่า','animals'));assert(inT('จอง','travel'));
 assert(!t.getBank().some(w=>w.th==='ฟ้อง'&&t.index[w.id]?.includes('sports')));}
// The theme grid: 23 tiles in the general deck, none in the slang deck.
assert.equal((t.topicGrid().match(/<button class="x-tile/g)||[]).length,23);t.setWordDeck('slang');assert.equal((t.topicGrid().match(/<button class="x-tile/g)||[]).length,12);for(const x of [...t.slangTopics(),...t.PHRASE_SCENES])assert(t.TOPIC_ICONS[x.id]||x.id==='s:trend','missing pictogram '+x.id);
 // Slang theme steps teach slang words of that category by frequency; the discriminatory category has no step.
 t.setWordTopic('s:ほめる・反応');t.startGuidedStep('s:ほめる・反応');{const g=t.getStep();assert(g&&g.news.length>0);assert(g.news.every(id=>t.getBank().find(w=>w.id===id).category==='スラング｜ほめる・反応'));t.exitStepSession()}
 t.setWordTopic('s:差別的表現');assert(!t.topicHub().includes('x-step-go'));t.startGuidedStep('s:差別的表現');assert(!t.getStep()||t.getStep().topic!=='s:差別的表現');t.exitStepSession();
 // Phrase deck: set phrases only, all ranges, its own search, scenes, and the deck is kept when a phrase is opened.
 t.setWordDeck('phrase');t.setLevel(500);const ph=t.selectedWords();assert(ph.length>250&&ph.every(w=>t.isPhrase(w)));for(const th of ['สวัสดี','ขอบคุณ','ไม่เป็นไร','ขอโทษ','จริงเหรอ','กี่บาท'])assert(ph.some(w=>w.th===th),th);assert(!ph.some(w=>w.th==='เอา'));
 assert.equal((t.topicGrid().match(/<button class="x-tile/g)||[]).length,8);assert.equal(t.phraseScene(ph.find(w=>w.th==='สวัสดี')),'p:greet');assert.equal(t.phraseScene(ph.find(w=>w.th==='จริงเหรอ')),'p:ask');
 t.setPhrase('ありがとう');assert(t.selectedWords().some(w=>w.th==='ขอบคุณ')&&t.selectedWords().length<10);t.setPhrase('');
 t.openWord(ph.find(w=>w.th==='ขอบคุณ').id);assert.equal(t.getDeck(),'phrase');const det=t.wordDetail();assert(!/お気に入り済み|お気に入り<|復習に登録</.test(det));assert(/aria-pressed="false"[^>]*>[^<]*<svg/.test(det));assert(det.includes('</svg>復習</button>'));
 t.setLevel(0);t.setWordDeck('general');
// A theme step teaches unseen words of that theme in frequency order and leaves the global step pointer alone.
const st=t.getState();st.stepWords=30;const next=t.topicNextWords('food');assert.equal(next.length,10);assert(next.every(w=>t.index[w.id].includes('food')));assert(next.every((w,i)=>i===0||next[i-1].studyRank<w.studyRank));
const before=t.topicStats().get('food').seen;t.setWordTopic('food');assert(t.topicHub().includes('食べ物・飲み物'));t.startGuidedStep('food');let g=t.getStep();assert.equal(g.topic,'food');
for(let k=0;k<300&&!g.done;k++){const task=g.tasks[g.i];if(task.type!=='learn')t.answerStepTask(task.id);t.nextStepTask()}
assert(g.done);assert.equal(st.stepWords,30,'theme steps must not move the frequency step pointer');assert.equal(t.topicStats().get('food').seen,before+10);assert(t.stepSessionView().includes('食べ物・飲み物 完了'));
assert(t.getState().today.steps>=1);assert.equal(t.topicNextWords('food').filter(w=>g.news.includes(w.id)).length,0);t.exitStepSession();
// Theme progress survives a backup round trip (derived from word records, not a separate field).
const copy=t.sanitizeWordState(JSON.parse(JSON.stringify(st)));assert.equal(g.news.filter(id=>copy.records[id]?.seen>0).length,10);
// A theme step shows the sense that belongs to the theme.
const bank=t.getBank();let target=null,topic=null;
for(const w of bank){const m=t.senses[w.id];if(!m||w.collection==='slang'||!w.meanings[0].checked)continue;for(const [tp,ns] of Object.entries(m)){const s=w.meanings.find(x=>x.sourceSense===ns[0]);if(!ns.includes(w.meanings[0].sourceSense)&&s&&s.checked&&s.ja!==w.meanings[0].ja){target=w;topic=tp;break}}if(target)break}
assert(target,'need a word whose theme sense is not its first sense');
for(const w of bank)if(w.studyRank&&w.studyRank<target.studyRank&&t.index[w.id]?.includes(topic))st.records[w.id]={...t.wordRec(w.id),seen:1};delete st.records[target.id];
t.setWordTopic(topic);t.startGuidedStep(topic);g=t.getStep();assert(g.news.includes(target.id));while(g.tasks[g.i].id!==target.id||g.tasks[g.i].type!=='learn'){const task=g.tasks[g.i];if(task.type!=='learn')t.answerStepTask(task.id);t.nextStepTask()}
const topicSense=target.meanings.find(x=>x.sourceSense===t.senses[target.id][topic][0]);assert(t.stepSessionView().includes(topicSense.ja),'theme sense shown');
console.log('PASS: theme study — 23 distinct pictograms, theme tiles for general (23), slang (12) and phrases (8), theme hub, theme steps by frequency with theme senses, progress from records, global step pointer untouched.');})().catch(e=>{console.error(e);process.exit(1)});
