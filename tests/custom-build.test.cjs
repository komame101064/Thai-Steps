const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','word-topics','words-app','lesson-quizzes','reorder-items','build-quiz'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));ctx.__bank=[...read('word-bank.json'),...read('word-bank-more.json'),...read('slang-bank.json'),...read('slang-bank-more.json')];
vm.runInContext("bank=__bank;bankStatus='ready';render=()=>{};renderBuild=()=>{};toast=m=>{this.lastToast=m};this.t={customSegment,customItems,parseCustom,startCustomBuild,openBuildSetup,buildView,buildPick,buildCheck,buildNext,getState:()=>state,getBuild:()=>build,getView:()=>view}",ctx);
const t=ctx.t,seg=s=>t.customSegment(s).map(x=>x.th);
// A typed sentence is split into dictionary words that join back to the sentence, each with a reading.
assert.deepEqual(seg('ฉันชอบกินข้าวผัด'),['ฉัน','ชอบ','กิน','ข้าวผัด']);
for(const s of ['พรุ่งนี้จะไปทะเลกับเพื่อน','คุณพูดภาษาไทยได้ไหม','เมื่อวานฝนตกหนักมาก']){const x=t.customSegment(s);assert.equal(x.map(y=>y.th).join(''),s);assert(x.length>=3);assert(x.every(y=>y.ro),s)}
// ๆ stays with its word; spaces and punctuation are boundaries; unknown letters are kept as one piece.
assert.deepEqual(seg('ช้าๆ หน่อย'),['ช้าๆ','หน่อย']);
const u=t.customSegment('ผมชอบกฮฮฮ');assert.equal(u.map(y=>y.th).join(''),'ผมชอบกฮฮฮ');assert(u.some(y=>y.unk));
// One line per sentence; "/" adds a translation (either order); lines without Thai are ignored.
assert.deepEqual(JSON.parse(JSON.stringify(t.parseCustom('ฉันหิว / お腹がすいた\n私は学生です／ผมเป็นนักเรียน\nhello\n\nไปไหน'))),[{th:'ฉันหิว',ja:'お腹がすいた'},{th:'ผมเป็นนักเรียน',ja:'私は学生です'},{th:'ไปไหน',ja:''}]);
// Practice from typed text: setup has the tab, items come from the text, distractors are added by level, results leave records alone.
const st=t.getState();st.buildSrc='custom';t.openBuildSetup();assert(t.buildView().includes('この文で練習'));
st.buildCustomText='ฉันชอบกินข้าวผัด / 私はチャーハンが好きです\nพรุ่งนี้จะไปทะเลกับเพื่อน\nสวัสดี';st.buildLevel=2;const before=JSON.stringify([st.missed,st.done,st.passed]);
t.startCustomBuild();const b=t.getBuild();assert.equal(t.getView(),'build');assert.equal(b.origin,'custom');assert.equal(b.items.length,2);
for(const q of b.items){assert.equal(q.chips.length-q.tokens.length,1);q.tokens.forEach(tok=>t.buildPick(q.chips.findIndex((c,i)=>c.th===tok.th&&!q.picked.includes(i))));const v=t.buildView();assert(v.includes('入力した文'));assert(q.it.ja?v.includes(q.it.ja):v.includes('音声を聞いて'));t.buildCheck();assert.strictEqual(q.checked,true);t.buildNext()}
assert.equal(JSON.stringify([st.missed,st.done,st.passed]),before);
console.log('PASS: typed sentences become reorder puzzles — dictionary split with readings, optional translation, distractors, records untouched.');
