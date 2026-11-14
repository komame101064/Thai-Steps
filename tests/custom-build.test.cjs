const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','word-topics','words-app','lesson-quizzes','reorder-items','build-quiz'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));ctx.__bank=[...read('word-bank.json'),...read('word-bank-more.json'),...read('slang-bank.json'),...read('slang-bank-more.json')];
vm.runInContext("bank=__bank;bankStatus='ready';render=()=>{};renderBuild=()=>{};toast=m=>{this.lastToast=m};this.t={customSegment,parseCustom,startCustomBuild,buildMakeThai,openBuildSetup,buildView,buildPick,buildCheck,buildNext,getState:()=>state,getBuild:()=>build,getView:()=>view}",ctx);
const t=ctx.t,seg=s=>t.customSegment(s).map(x=>x.th);
// A typed sentence is split into dictionary words that join back to the sentence, each with a reading.
assert.deepEqual(seg('ฉันชอบกินข้าวผัด'),['ฉัน','ชอบ','กิน','ข้าวผัด']);
for(const s of ['พรุ่งนี้จะไปทะเลกับเพื่อน','คุณพูดภาษาไทยได้ไหม','เมื่อวานฝนตกหนักมาก']){const x=t.customSegment(s);assert.equal(x.map(y=>y.th).join(''),s);assert(x.length>=3);assert(x.every(y=>y.ro),s)}
// ๆ stays with its word; spaces and punctuation are boundaries; unknown letters are kept as one piece.
assert.deepEqual(seg('ช้าๆ หน่อย'),['ช้าๆ','หน่อย']);
const u=t.customSegment('ผมชอบกฮฮฮ');assert.equal(u.map(y=>y.th).join(''),'ผมชอบกฮฮฮ');assert(u.some(y=>y.unk));
// One line per sentence: Japanese lines get a Thai sentence; Thai lines are used as typed ("/" adds the other language).
assert.deepEqual(JSON.parse(JSON.stringify(t.parseCustom('ฉันหิว / お腹がすいた\n私は学生です／ผมเป็นนักเรียน\n明日海に行きます\n\nไปไหน'))),[{th:'ฉันหิว',ja:'お腹がすいた'},{th:'ผมเป็นนักเรียน',ja:'私は学生です'},{th:'',ja:'明日海に行きます'},{th:'ไปไหน',ja:''}]);
(async()=>{
 const sent=[];ctx.fetch=async url=>{url=String(url);if(url.includes('translate.googleapis.com')){const q=decodeURIComponent(url.split('q=')[1]);sent.push(q);return {ok:true,json:async()=>[[['ฉันอยากไปทะเลกับเพื่อนพรุ่งนี้',q]]]}}const f=url.split('?')[0].replace(/^\.?\//,'');return {ok:true,json:async()=>JSON.parse(fs.readFileSync('dist/'+f,'utf8'))}};
 const st=t.getState();st.buildSrc='custom';t.openBuildSetup();assert(t.buildView().includes('この文で練習')&&!t.buildView().includes('区切り'));
 // A sentence that is already in the app uses that checked example (no network); others are machine-translated and labelled.
 const L=vm.runInContext('lessons',ctx),ex=L[0].examples[0];
 st.buildCustomText=ex.ja+'\n明日、友だちと海に行きたい\nฉันชอบกินข้าวผัด / 私はチャーハンが好きです';
 await t.buildMakeThai();const P=vm.runInContext('buildPreview',ctx);
 assert.equal(P.rows[0].opts[0].src,'example');assert.equal(P.rows[0].opts[0].th,ex.th.replace(/\s+/g,''));
 assert.equal(P.rows[1].opts[0].src,'mt');assert.deepEqual(sent,['明日、友だちと海に行きたい']);
 assert.equal(P.rows[2].opts[0].src,'input');

 // Translations are cached on the device, so the same sentence is not sent twice.
 vm.runInContext('buildPreview=null',ctx);await t.buildMakeThai();assert.equal(sent.length,1);
 // Practice: one puzzle per line, Japanese shown as the prompt, extra words by level, records untouched.
 st.buildLevel=2;const before=JSON.stringify([st.missed,st.done,st.passed]);
 await t.startCustomBuild();const b=t.getBuild();assert.equal(t.getView(),'build');assert.equal(b.origin,'custom');assert.equal(b.items.length,3);
 for(const q of b.items){assert(q.it.ja);assert.equal(q.chips.length-q.tokens.length,1);assert.equal(q.tokens.map(x=>x.th).join(''),q.it.th);assert(q.tokens.every(x=>x.ro));q.tokens.forEach(tok=>t.buildPick(q.chips.findIndex((c,i)=>c.th===tok.th&&!q.picked.includes(i))));const h=t.buildView();assert(h.includes(q.it.ja));if(q.it.src==='mt')assert(h.includes('機械翻訳'));t.buildCheck();assert.strictEqual(q.checked,true);t.buildNext()}
 assert.equal(JSON.stringify([st.missed,st.done,st.passed]),before);
 console.log('PASS: Japanese sentences become reorder puzzles — app examples first, machine translation (labelled, cached) otherwise; Thai input still works.');
})().catch(e=>{console.error(e);process.exit(1)});
