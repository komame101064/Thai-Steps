const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
const read=n=>JSON.parse(fs.readFileSync('dist/'+n,'utf8'));ctx.__b=[...read('word-bank.json'),...read('word-bank-more.json'),...read('slang-bank.json'),...read('slang-bank-more.json')];ctx.__es=read('example-senses.json');
vm.runInContext("bank=__b;bankStatus='ready';exampleSenses=__es;wordSession=null;stepSession=null",ctx);
const S=ctx.__es,ex={...read('sense-examples.json'),...read('more-examples.json')};assert(Object.keys(S).length>5000);
// Every tag names a real sense of the word that the split finds in that example.
const idx=vm.runInContext('segEntries()',ctx);let n=0;for(const [k,m] of Object.entries(S))for(const [th,v] of Object.entries(m)){const w=idx.get(th);assert(w&&w.meanings.some(x=>x.sourceSense===v),k+' '+th);n++}
// Chips show the sense in use: the viewed word's own sense, a tagged sense for other words (e.g. ได้ = past/opportunity, อยู่ = progressive).
const chips=(k,head,s)=>{const e=ex[k];const w=idx.get(head);return vm.runInContext(`exampleBreakdown(${JSON.stringify(e.th)},${JSON.stringify(e.ro)},${JSON.stringify(head)},${JSON.stringify(e.ja)},bank.find(w=>w.id===${JSON.stringify(k.split('#')[0])}).meanings.find(m=>m.sourceSense===${s}),${JSON.stringify(k)})`,ctx)};
const k=Object.keys(S).find(k=>S[k]['อยู่']===2&&ex[k]);if(k){const head=ctx.__b.find(w=>w.id===k.split('#')[0]).th,h=chips(k,head,+k.split('#')[1]);const g=idx.get('อยู่').meanings.find(m=>m.sourceSense===2).ja.split(/[・（]/)[0];assert(h.includes(g),k)}
const v=ex['tl-00077#1'];if(v){const h=chips('tl-00077#1','ไว้',1);assert(h.includes('〜しておく')&&!h.includes('〜のときに'))}
console.log(`PASS: example chips show the sense in use — ${n} tagged words in ${Object.keys(S).length} examples.`);
