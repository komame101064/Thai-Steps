const fs=require('fs'),vm=require('vm'),assert=require('assert');
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({})},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},Date,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','words-app','word-usage'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};this.t={loadWordBank,getMap:()=>bankMap,wordUsagePanel,openWord,wordDetail,withThaiRo,usageMark,U:WORD_USAGE}",ctx);
(async()=>{const t=ctx.t;await t.loadWordBank();const U=t.U,m=t.getMap();let n=0;
 // Every group compares at least two registered general words, each with its own note; examples carry reading and Japanese.
 for(const [gid,g] of Object.entries(U.g)){n++;assert(g.w.length>=2,gid);for(const id of g.w){const w=m.get(id);assert(w&&w.collection!=='slang',gid+' '+id);assert(g.use[id],gid+' use '+id);assert(U.by[id].includes(gid))}assert(g.lead);for(const e of g.ex||[]){assert(e.th&&e.ro&&e.ja);assert(g.w.some(id=>e.th.includes(m.get(id).th)),gid+' example')}assert(!/\bSVO\b|S\s*\+\s*V/.test(JSON.stringify(g)))}
 assert(n>500,'groups '+n);
 // 同じ文で比べる: most groups have 2-3 sentences, each with its own compared word in it.
 {let k=0;for(const g of Object.values(U.g)){if(!g.pr)continue;k++;assert(g.pr.length>=2&&g.pr.length<=3);for(const p of g.pr){assert(g.w.includes(p.id)&&p.th.includes(m.get(p.id).th)&&p.ro&&p.ja&&p.point)}}assert(k>n*0.9,'pairs '+k)}
 // The detail page of a word in a group shows the panel with the word highlighted and the others linked.
 const id=Object.keys(U.by).find(i=>m.get(i).th==='ดู');assert(id);const html=t.wordUsagePanel(m.get(id));assert(html.includes('同じ文で比べる')&&html.includes('それぞれの使い方')&&html.includes('似た言葉との使い分け')&&html.includes('is-current')&&/openWord\('tl-/.test(html)&&html.includes('ネイティブ話者の確認ではありません'));
 t.openWord(id);assert(t.wordDetail().includes('似た言葉との使い分け'));assert(html.indexOf('is-current')<html.indexOf('openWord('),'current word first');
 // Thai inside the explanations gets a tone reading.
 // Compared words have one colour each, the same in the list, the explanations and the examples; words and examples can be played.
 assert(/class="uc uc-1"/.test(html)&&/w-usage-chip uc-2/.test(html),'colour coding');assert(/playWord\('tl-/.test(html)&&/speakThaiText\(this\.dataset\.th\)/.test(html),'audio buttons');
 // Other Thai inside the explanations gets a tone reading.
 assert.equal(t.withThaiRo('แค่ と เท่านั้น').match(/th-in-ro/g).length,2);{const m=t.usageMark('แค่ と เพียงแค่ と ไป',{'แค่':1,'เพียงแค่':2},true);assert(m.includes('uc-2" lang="th">เพียงแค่')&&m.includes('uc-1" lang="th">แค่')&&/th-in-ro/.test(m),'longest compared word first; others read')}
 // A word without a group shows nothing.
 const lone=[...m.values()].find(w=>!U.by[w.id]&&w.collection!=='slang');assert.equal(t.wordUsagePanel(lone),'');
 console.log(`PASS: ${n} usage groups (${Object.keys(U.by).length} words) — registered words, a note per word, examples with readings; shown on the word page with links; AI-written, not native-verified.`);
})().catch(e=>{console.error(e);process.exit(1)});
