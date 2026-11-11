const fs=require('fs'),vm=require('vm'),assert=require('assert');
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json','sense-examples.json','slang-examples.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const store={};const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({}),createElement:()=>({setAttribute(){},className:''})},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},Date,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};this.t={seg:segmentSentence,exampleBreakdown,fillDictLinks,loadWordBank,loadSenseExamples,getMap:()=>bankMap,openWord,wordDetail,startWords,revealWordCard,wordSessionView,exitWordSession,getSession:()=>wordSession,setQuiz:m=>{wordQuizMode=m},startGuidedStep,stepSessionView,getStep:()=>stepSession,exitStepSession}",ctx);
(async()=>{const t=ctx.t;await t.loadWordBank();await t.loadSenseExamples();
// Every example: a split is offered only when complete; it almost always exists and keeps the headword whole.
const ex={...data['sense-examples.json'],...data['more-examples.json'],...data['slang-examples.json']};let n=0,ok=0,head=0;
for(const [k,e] of Object.entries(ex)){n++;const w=t.getMap().get(k.split('#')[0]);const toks=t.seg(e.th,e.ro,w?w.th:'');if(!toks)continue;ok++;
 assert(toks.every(x=>x.kind!=='unknown'));{const strip=s=>s.replace(/[\s.,!?…"“”'‘’()「」:;\-]/g,'');assert.equal(strip(toks.map(x=>x.th).join('')),strip(e.th))};if(w&&toks.some(x=>x.th===w.th))head++}
assert(ok/n>0.985,'coverage '+ok/n);assert(head/ok>0.99,'headword kept '+head/ok);
const split=(th,ro,p='')=>t.seg(th,ro,p).map(x=>x.th).join('|');
assert.equal(split('คุณมาจากไหน','khun maa càak nǎi'),'คุณ|มา|จาก|ไหน');
assert(split('ใส่น้ำลงไปอีกหน่อย','sài náam long pai ìik nɔ̀i','ลง').split('|').includes('ลง'));
// Detail view: the chips open the word. Card back and step learning: the chips only speak, never navigate.
const kin=[...t.getMap().values()].find(w=>w.th==='กิน'&&w.collection!=='slang');t.openWord(kin.id);const d=t.wordDetail();assert(d.includes('単語に分解'));assert(/class="w-seg-chip" onclick="openWord\('/.test(d));
t.startWords('cards',[kin.id]);t.revealWordCard();const back=t.wordSessionView();assert(back.includes('単語に分解'));const seg=back.slice(back.indexOf('class="w-seg"'));assert(!/openWord\(/.test(seg.slice(0,seg.indexOf('</details>'))));t.exitWordSession();
// Questions never show a split (it would give the answer away).
t.setQuiz('th-ja');t.startWords('quiz',[kin.id]);assert(!t.wordSessionView().includes('w-seg'));t.exitWordSession();
t.startGuidedStep();const g=t.getStep();for(let k=0;k<g.tasks.length;k++){g.i=k;g.answered=null;if(g.tasks[k].type==='learn')continue;g.choices=[g.tasks[k].id,...[...t.getMap().keys()].slice(0,3)];assert(!t.stepSessionView().includes('w-seg'),'no split on a question face');break}t.exitStepSession();
// Grammar lesson word panel: dictionary words get a link.
const item={kids:[],querySelector(sel){if(sel==='.word-th')return {textContent:'กิน'};if(sel==='.word-dict')return this.kids.find(c=>/word-dict/.test(c.className))||null;if(sel==='.word-meaning')return this;return null},appendChild(c){this.kids.push(c)}};
t.fillDictLinks({querySelectorAll:()=>[item]});assert.equal(item.kids.length,1);assert(/辞書/.test(item.kids[0].textContent));
console.log(`PASS: example breakdown — ${(100*ok/n).toFixed(1)}% of ${n} examples split completely, headword kept whole in ${(100*head/ok).toFixed(1)}%; links in the detail view, sound-only in sessions, never on question faces; grammar words link to the dictionary.`);})().catch(e=>{console.error(e);process.exit(1)});
