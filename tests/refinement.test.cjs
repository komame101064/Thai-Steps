const fs=require('fs'),vm=require('vm'),assert=require('assert');
const bank=JSON.parse(fs.readFileSync('dist/word-bank.json'));
const examples=JSON.parse(fs.readFileSync('dist/sense-examples.json'));
const review=JSON.parse(fs.readFileSync('scripts/editorial-review-20261110.json'));
assert.equal(review.changes.length,52);
for(const change of review.changes){
 const w=bank.find(w=>w.id===change.id),m=w.meanings.find(m=>m.sourceSense===change.sourceSense),e=examples[w.id+'#'+m.sourceSense];
 assert.equal(m.ja,change.after.meaning);assert.equal(e.ja,change.after.example);assert(m.checked&&e.checked);assert.equal(e.th,change.thaiExample);assert.equal(e.ro,change.romanExample);
}
const term=th=>bank.find(w=>w.th===th),sense=(th,n)=>term(th).meanings.find(m=>m.sourceSense===n);
assert(!sense('นำ',2).ja.includes('鉛'));assert.equal(sense('ซึ่ง',2).pos,'前置詞');assert(sense('ซึ่ง',2).note.includes('นำมาซึ่ง'));
assert(sense('ตี',3).ja.includes('1〜5時'));assert.equal(sense('ร้าน',2).pos,'類別詞');
const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({})},localStorage:{getItem:()=>JSON.stringify({dailyGoal:999,records:{'tl-00001':{stage:2.8,seen:-1,correct:'Infinity',due:'NaN'},'tl-00002':null}}),setItem(){}},Date,Math,location:{hash:''},setTimeout,clearTimeout};vm.createContext(ctx);
for(const name of ['data','expansion','readings','vocabulary','structures','words-app'])vm.runInContext(fs.readFileSync('dist/'+name+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext(`this.t={sanitizeWordState,getState:()=>wordState};`,ctx);
const state=ctx.t.getState();assert.equal(state.dailyGoal,10);assert.equal(state.records['tl-00001'].stage,2);assert.equal(state.records['tl-00001'].seen,0);assert.equal(state.records['tl-00001'].correct,0);assert.equal(state.records['tl-00001'].due,0);assert(!state.records['tl-00002']);assert.equal(ctx.t.sanitizeWordState(null).dailyGoal,10);
// Replaying an error must retain the checked theme sense, even if the ordinary first sense is unreviewed.
ctx.fixture=[{id:'tl-90001',th:'ทดสอบ',ro:'thót sɔ̀ɔp',frequency:5,pos:'名詞',category:'x',meanings:[{sourceSense:1,ja:'参考訳',checked:false,pos:'名詞'},{sourceSense:2,ja:'校閲したテーマの意味',checked:true,pos:'名詞'}],relations:{}}];
vm.runInContext(`bank=fixture;bankMap=new Map(bank.map(w=>[w.id,w]));wordTopic='body';WORD_TOPIC_SENSES={'tl-90001':{body:[2]}};render=()=>{};toast=()=>{};makeWordQuestion=w=>{if(!w.meanings[0].checked)throw Error('wrong sense');return [w.id]};startWords('quiz',['tl-90001']);this.session=wordSession;this.answer=answerWord;`,ctx);
assert.equal(ctx.session.ids[0],'tl-90001');ctx.answer('tl-unknown');assert.equal(ctx.session.answered,null);assert.equal(ctx.session.results.length,0);
console.log('PASS: 52 inspected meanings/examples; compound usage notes and POS; corrupted saved-state recovery; theme-specific quiz retry; invalid answers ignored.');
