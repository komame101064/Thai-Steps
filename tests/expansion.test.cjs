const fs=require('fs'),vm=require('vm'),assert=require('assert');const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));
const core=read('word-bank.json'),slang=read('slang-bank.json'),more=read('word-bank-more.json'),moreEx=read('more-examples.json'),report=read('expansion-review.json');
// Additions never touch the original records, ids or headwords.
assert.equal(core.length,5000);const ids=new Set([...core,...slang].map(w=>w.id)),ths=new Set([...core,...slang].map(w=>w.th));
let senses=0;for(const w of more){assert(/^tl-\d{5}$/.test(w.id)&&!ids.has(w.id),w.id);ids.add(w.id);assert(!ths.has(w.th),w.th+' already registered');ths.add(w.th);
 assert.equal(w.frequencyEstimated,true);assert.equal(w.frequencyBasis,'textbook');assert(w.frequency>=1&&w.frequency<=5);assert.equal(w.bucket,20000);assert(w.expansion&&w.source);
 for(const m of w.meanings){senses++;const e=moreEx[w.id+'#'+m.sourceSense];assert(e&&e.th.includes(w.th)&&e.ro&&e.ja&&e.en,w.id);assert.equal(m.reviewStatus,'reviewed');assert(/AI/.test(m.reviewMethod));assert(['newthai-v2.4','thai-steps-'+w.expansion].includes(e.sourceExample))}}
assert.equal(Object.keys(moreEx).length,senses);assert.equal(report.published,more.length);assert.equal(report.senses,senses);assert.equal(report.nativeReview,false);
assert.equal(report.batches.reduce((n,b)=>n+b.published,0),more.length);for(const b of report.batches)assert.equal(b.unreviewed||0,0,'every authored entry must be reviewed before a batch ships');
// App: additions load, are searchable, and leave the 500/1,000/3,000 study ranges unchanged.
const files={'word-bank.json':core,'slang-bank.json':slang,'word-bank-more.json':more};
function boot(withMore){const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},fetch:async u=>u in files&&(withMore||u!=='word-bank-more.json')?{ok:true,json:async()=>files[u]}:{ok:false},view:'home',render(){},esc:s=>String(s),icon:()=>'',toast(){}};vm.createContext(ctx);
 for(const n of ['kana-search','word-topics','word-origins','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
 vm.runInContext('this.t={load:loadWordBank,get bank(){return bank},get status(){return bankStatus},selected:selectedWords,setLevel:n=>{wordState.level=n},setQuery:q=>{wordQuery=q},lib:WORD_LIBRARY,topicIds:wordTopicIds}',ctx);return ctx.t}
(async()=>{const a=boot(false),b=boot(true);await a.load();await b.load();assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.equal(b.bank.length,a.bank.length+more.length);
 for(const n of [500,1000,3000]){a.setLevel(n);b.setLevel(n);assert.deepEqual(b.selected().map(w=>w.id),a.selected().map(w=>w.id),'level '+n)}
 a.setLevel(0);b.setLevel(0);assert.equal(b.selected().length,a.selected().length+more.length);
 assert.equal(b.lib.unique,new Set(b.bank.map(w=>w.th)).size);
 const w=more[0];b.setQuery(w.th);assert(b.selected().some(x=>x.id===w.id));b.setQuery(w.meanings[0].ja);assert(b.selected().some(x=>x.id===w.id));
 for(const x of more)assert(b.topicIds(x).length,'topic for '+x.id);
 console.log(`PASS: ${more.length.toLocaleString('en')} reviewed additions, ${senses.toLocaleString('en')} senses with examples; original 5,000 records and 500/1,000/3,000 ranges unchanged; ${b.lib.unique.toLocaleString('en')} unique headwords; AI-reviewed, not native-verified.`)})().catch(e=>{console.error(e);process.exit(1)});
