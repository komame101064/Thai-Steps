const fs=require('fs'),vm=require('vm'),assert=require('assert');const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));
const core=read('word-bank.json'),slang=read('slang-bank.json'),more=read('word-bank-more.json'),slangMore=fs.existsSync('dist/slang-bank-more.json')?read('slang-bank-more.json'):[],moreEx=read('more-examples.json'),report=read('expansion-review.json');
// Additions never touch the original records, ids or headwords.
assert.equal(core.length,5000);const ids=new Set([...core,...slang].map(w=>w.id)),ths=new Set([...core,...slang].map(w=>w.th));
let senses=0;for(const w of more){assert(/^tl-\d{5}$/.test(w.id)&&!ids.has(w.id),w.id);ids.add(w.id);assert(!ths.has(w.th),w.th+' already registered');ths.add(w.th);
 const ed=w.source==='thai-steps-editorial';assert.equal(w.frequencyEstimated,true);assert(['corpus',ed?'editorial':'textbook'].includes(w.frequencyBasis),w.id+' '+w.frequencyBasis);assert(Number.isInteger(w.frequency)&&w.frequency>=1&&w.frequency<=10);assert(Number.isInteger(w.frequencyPrior));assert(ed?/^tl-5/.test(w.id):/^tl-4/.test(w.id),w.id);assert.equal(w.bucket,20000);assert(w.expansion&&w.source);
 for(const m of w.meanings){senses++;const e=moreEx[w.id+'#'+m.sourceSense];assert(e&&e.th.includes(w.th)&&e.ro&&e.ja&&e.en,w.id);assert.equal(m.reviewStatus,'reviewed');assert(/AI/.test(m.reviewMethod));assert(['newthai-v2.4','thai-steps-'+w.expansion].includes(e.sourceExample))}}
// Editorial slang additions: their own id range, slang-list fields, a scene for every example, no duplicate of an existing slang item.
const slangTh=new Set(slang.map(w=>w.th));for(const w of slangMore){assert(/^tl-6\d{4}$/.test(w.id)&&!ids.has(w.id),w.id);ids.add(w.id);assert(!slangTh.has(w.th),w.th+' already a slang item');slangTh.add(w.th);
 assert.equal(w.collection,'slang');assert.equal(typeof w.adult,'boolean');assert.equal(w.frequencyBasis,'editorial');assert(/^スラング｜/.test(w.category));
 for(const m of w.meanings){senses++;const e=moreEx[w.id+'#'+m.sourceSense];assert(e&&e.th.includes(w.th)&&e.ro&&e.ja&&e.context,w.id);assert(m.isSlang&&m.note&&m.speechStyle);assert.equal(m.reviewStatus,'reviewed')}}
assert.equal(Object.keys(moreEx).length,senses);assert.equal(report.published,more.length+slangMore.length);assert.equal(report.senses,senses);assert.equal(report.nativeReview,false);
assert.equal(report.batches.reduce((n,b)=>n+b.published,0),more.length+slangMore.length);for(const b of report.batches)assert.equal(b.unreviewed||0,0,'every authored entry must be reviewed before a batch ships');
// App: additions load, are searchable, and leave the 500/1,000/3,000 study ranges unchanged.
const files={'word-bank.json':core,'slang-bank.json':slang,'word-bank-more.json':more,'slang-bank-more.json':slangMore};
function boot(withMore){const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},fetch:async u=>u in files&&(withMore||!/-more\.json$/.test(u))?{ok:true,json:async()=>files[u]}:{ok:false},view:'home',render(){},esc:s=>String(s),icon:()=>'',toast(){}};vm.createContext(ctx);
 for(const n of ['kana-search','word-topics','word-origins','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
 vm.runInContext('this.t={load:loadWordBank,get bank(){return bank},get status(){return bankStatus},selected:selectedWords,setLevel:n=>{wordState.level=n},setQuery:q=>{wordQuery=q},lib:WORD_LIBRARY,topicIds:wordTopicIds}',ctx);return ctx.t}
(async()=>{const a=boot(false),b=boot(true);await a.load();await b.load();assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.equal(b.bank.length,a.bank.length+more.length+slangMore.length);
 for(const n of [500,1000,3000]){a.setLevel(n);b.setLevel(n);assert.deepEqual(b.selected().map(w=>w.id),a.selected().map(w=>w.id),'level '+n)}
 {const seen=new Set();let total=0;for(const n of [500,1000,3000,5000]){b.setLevel(n);const ids=b.selected().map(w=>w.id);assert(ids.every(id=>!seen.has(id)),'ranges do not overlap');ids.forEach(id=>seen.add(id));total+=ids.length}b.setLevel(0);assert.equal(total,b.selected().length,'基本＋日常＋会話＋発展＝全部')}
 a.setLevel(0);b.setLevel(0);{const orig=a.selected(),five=b.selected().filter(w=>w.studyRank<=5000),ids=new Set(five.map(w=>w.id));assert.equal(five.length,5000);assert(orig.every(w=>ids.has(w.id)),'5,000 keeps every original word');const extra=five.filter(w=>w.expansion);assert.equal(extra.length,5000-orig.length);// Additions follow the app's own study order (frequency, then rank), behind every original word.
const byRank=more.slice().sort((x,y)=>y.frequency-x.frequency||x.corpusRank-y.corpusRank||x.id.localeCompare(y.id)).slice(0,extra.length).map(w=>w.id).sort();assert.deepEqual(extra.map(w=>w.id).sort(),byRank)}
 a.setLevel(0);b.setLevel(0);assert.equal(b.selected().length,a.selected().length+more.length);
 assert.equal(b.lib.unique,new Set(b.bank.map(w=>w.th)).size);
 const w=more[0];b.setQuery(w.th);assert(b.selected().some(x=>x.id===w.id));b.setQuery(w.meanings[0].ja);assert(b.selected().some(x=>x.id===w.id));
 for(const x of more)assert(b.topicIds(x).length,'topic for '+x.id);
 // Frequency on one scale: an added word never ranks above a part of it (the 成り立ち split), ไทย is not below ประเทศไทย,
// one-syllable added words stay low unless checked, and the base 5,000 keep their measured values.
{const byTh=new Map(),all=[...core,...more].filter(w=>w.collection!=='slang');for(const w of all){const c=byTh.get(w.th);if(!c||w.frequency>c.frequency)byTh.set(w.th,w)}
 const f=th=>byTh.get(th).frequency;assert(f('ไทย')>=f('ประเทศไทย'));assert(f('ไทย')>=9);assert(f('ภาษาไทย')<=f('ไทย'));assert(f('ญี่ปุ่น')>=7);
 assert(more.filter(w=>!/\s/.test(w.ro)&&!['ไทย','จีน','ลาว','นึง'].includes(w.th)).every(w=>w.frequency<=4));
 assert(more.filter(w=>/ๆ/.test(w.th)).every(w=>{const b=byTh.get(w.th.replace(/ๆ/g,'').trim());return !b||w.frequency<=b.frequency}));
 assert(report.frequency&&report.frequency.corpus>4000);}
console.log(`PASS: ${more.length.toLocaleString('en')} reviewed additions, ${senses.toLocaleString('en')} senses with examples; original 5,000 records and 500-3,000 ranges unchanged; 5,000 = all originals + top additions in study order; ${b.lib.unique.toLocaleString('en')} unique headwords; AI-reviewed, not native-verified.`)})().catch(e=>{console.error(e);process.exit(1)});
