// Merge scripts/chip-sense/results/*.jsonl into dist/example-senses.json: {"tl-…#n": {"word": sourceSense}}.
// Only picks that differ from the word's main sense are stored (the app shows the main sense otherwise). AI judgments.
const fs=require('fs'),path=require('path');const W=__dirname,D=path.join(W,'..','..','dist');
const read=n=>JSON.parse(fs.readFileSync(path.join(D,n),'utf8'));const bank=[...read('word-bank.json'),...read('word-bank-more.json'),...read('slang-bank.json'),...read('slang-bank-more.json')];
const main=new Map();for(const w of bank){if(main.has(w.th))continue;const ms=w.meanings.filter(m=>!m.isSlang);main.set(w.th,new Set((ms.length?ms:w.meanings).map(m=>m.sourceSense)))}
const out={};let n=0,kept=0;
for(const f of fs.readdirSync(path.join(W,'results')).filter(f=>f.endsWith('.jsonl')).sort()){
 const inp=new Map(fs.readFileSync(path.join(W,'input',f),'utf8').split('\n').filter(Boolean).map(l=>{const x=JSON.parse(l);return [x.k,x]}));
 for(const l of fs.readFileSync(path.join(W,'results',f),'utf8').split('\n').filter(Boolean)){const r=JSON.parse(l),x=inp.get(r.k);if(!x)continue;
  for(const t of x.toks){const v=r.p&&r.p[t.t];n++;if(!v||v===t.s[0][0]||!t.s.some(s=>s[0]===v))continue;(out[r.k]=out[r.k]||{})[t.t]=v;kept++}}}
fs.writeFileSync(path.join(D,'example-senses.json'),JSON.stringify(out));console.log({tokens:n,nonMain:kept,examples:Object.keys(out).length})
