const fs=require('fs'),vm=require('vm'),assert=require('assert');
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const store={};const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({})},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},Date,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};this.t={freqBand,freqLabel,FREQ_BANDS,wordMeta,selectedWords,loadWordBank,getBank:()=>bank,setF:v=>{wordFrequency=v},wordsView}",ctx);
(async()=>{const t=ctx.t;await t.loadWordBank();
assert.equal(t.FREQ_BANDS.length,3);for(const [n,b] of [[10,'high'],[7,'high'],[6,'mid'],[4,'mid'],[3,'low'],[1,'low']])assert.equal(t.freqBand(n),b);
const w=t.getBank().find(x=>x.frequency===10);assert(t.wordMeta(w).includes('頻度:高'));assert(!/頻度:\d/.test(t.wordMeta(w)));
for(const [v,lo,hi] of [['high',7,10],['mid',4,6],['low',1,3]]){t.setF(v);const out=t.selectedWords();assert(out.length>0);assert(out.every(x=>x.frequency>=lo&&x.frequency<=hi),v)}
t.setF('');const html=t.wordsView();assert(html.includes('頻度:高')&&html.includes('頻度:中')&&html.includes('頻度:低'));assert(!html.includes('頻度:10'));
console.log('PASS: frequency shown and filtered as 高・中・低 (7-10 / 4-6 / 1-3); data keeps 1-10.');})().catch(e=>{console.error(e);process.exit(1)});
