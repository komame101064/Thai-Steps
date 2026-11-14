// Inputs for tagging which sense each multi-sense word has inside each example sentence (「単語に分解」 chips).
// One line per example: {k, th, ja, toks:[{t, s:[[sourceSense, ja], ...]}]} — only words with 2+ ordinary senses,
// and not the example's own headword (the app already shows that sense). Output is merged by scripts/chip-sense/build.cjs.
const fs=require('fs'),vm=require('vm'),path=require('path');const D=path.join(__dirname,'..','..','dist');
const ctx={console,window:{scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({}),getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','word-topics','words-app'])vm.runInContext(fs.readFileSync(path.join(D,n+'.js'),'utf8'),ctx);
const read=n=>JSON.parse(fs.readFileSync(path.join(D,n),'utf8'));ctx.__b=[...read('word-bank.json'),...read('word-bank-more.json'),...read('slang-bank.json'),...read('slang-bank-more.json')];
vm.runInContext('bank=__b',ctx);const byId=new Map(ctx.__b.map(w=>[w.id,w]));const ex={...read('sense-examples.json'),...read('more-examples.json'),...read('slang-examples.json')};
const lines=[];for(const [k,e] of Object.entries(ex).sort()){const head=byId.get(k.split('#')[0]);const t=vm.runInContext('segmentSentence('+JSON.stringify(e.th)+','+JSON.stringify(e.ro)+','+JSON.stringify(head?head.th:'')+')',ctx);if(!t)continue;const seen=new Set(),toks=[];
 for(const x of t){if(x.kind!=='word'||seen.has(x.w.th)||(head&&x.w.th===head.th))continue;seen.add(x.w.th);const ms=x.w.meanings.filter(m=>!m.isSlang);if(ms.length<2)continue;toks.push({t:x.w.th,s:ms.map(m=>[m.sourceSense,m.ja])})}
 if(toks.length)lines.push(JSON.stringify({k,th:e.th,ja:e.ja,toks}))}
const N=40,per=Math.ceil(lines.length/N);for(let i=0;i<N;i++)fs.writeFileSync(path.join(__dirname,'input',`c${String(i+1).padStart(2,'0')}.jsonl`),lines.slice(i*per,(i+1)*per).join('\n')+'\n');
console.log(lines.length,'examples',per,'per chunk')
