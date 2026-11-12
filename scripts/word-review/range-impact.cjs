// Usage: node scripts/word-review/range-impact.cjs changes.json  ({"tl-xxxxx": newFrequency})
// Prints how many general words would move between learning ranges (必須/基本/日常/実用/発展).
const fs=require('fs'),vm=require('vm');
const changes=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
async function ranks(patch){
 const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json'];
 const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
 if(patch)for(const n of names)if(Array.isArray(data[n]))for(const w of data[n])if(changes[w.id]!==undefined)w.frequency=changes[w.id];
 const store={};const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({})},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},Date,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
 vm.createContext(ctx);
 for(const n of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
 vm.runInContext("var view=\"home\";render=()=>{};toast=()=>{};this.t={loadWordBank,stepOrder}",ctx);
 await ctx.t.loadWordBank();
 return new Map(ctx.t.stepOrder().map(w=>[w.id,[w.studyRank,w.th]]));
}
const lv=r=>r<=300?'必須':r<=1000?'基本':r<=2000?'日常':r<=3000?'実用':'発展';
(async()=>{const a=await ranks(false),b=await ranks(true);const moves={};let n=0;const lines=[];
 for(const [id,[r,th]] of a){const r2=b.get(id)?.[0];if(!r2)continue;if(lv(r)!==lv(r2)){n++;const k=lv(r)+'→'+lv(r2);moves[k]=(moves[k]||0)+1;if(changes[id]!==undefined||lines.length<40)lines.push(`${th} ${r}→${r2} ${k}${changes[id]!==undefined?' (changed)':''}`)}}
 console.log('words changing range:',n,moves);console.log(lines.join('\n'))})();
