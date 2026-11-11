const fs=require('fs'),vm=require('vm'),assert=require('assert');
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({})},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},Date,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const name of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','word-origins','words-app'])vm.runInContext(fs.readFileSync('dist/'+name+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};view='home';this.t={wordOriginRows,loadWordBank,selectedWords,wordTopics,setWordTopic,setWordDeck,setCategory:x=>{wordCategory=x},wordTrend,wordTrendBadge,dictionaryResults,getBank:()=>bank}",ctx);
(async()=>{const t=ctx.t;await t.loadWordBank();const bank=t.getBank(),byId=new Map(bank.map(w=>[w.id,w]));
const list=JSON.parse(fs.readFileSync('scripts/word-trends.json','utf8'));
assert(list.length>=80);assert.equal(new Set(list.map(e=>e.id)).size,list.length);
for(const e of list){const w=byId.get(e.id);assert(w,e.id);assert.equal(w.th,e.th);assert(['新語','流行語'].includes(e.kind));assert(e.reason);assert.equal(e.deck,w.collection==='slang'?'slang':'general');if(e.kind==='流行語')assert(e.era,e.th);}
// General deck: the 流行語・新語 theme, with only the new senses (แชร์ = SNS share, not the pyramid-scheme sense).
assert(t.wordTopics().some(x=>x.id==='trend'&&x.label==='流行語・新語'));
t.setWordTopic('trend');const g=t.selectedWords();
for(const th of ['เจนแซด','อินฟลูเอนเซอร์','แฮชแท็ก','เอไอ','พร้อมเพย์','ล็อกดาวน์'])assert(g.some(w=>w.th===th),th);
for(const th of ['คอมพิวเตอร์','อีเมล','อินเทอร์เน็ต','ข้าว'])assert(!g.some(w=>w.th===th),th);
const share=g.find(w=>w.th==='แชร์');assert(share&&share.meanings.every(m=>list.find(e=>e.id===share.id).senses.includes(m.sourceSense)));
assert(g.every(w=>w.collection!=='slang'));
// Slang deck: 分類 filter.
t.setWordTopic('');t.setWordDeck('slang');t.setCategory('trend');const s=t.selectedWords();
for(const th of ['ปังปุริเย่','อิหยังวะ','ติ่ง','ทัวร์ลง'])assert(s.some(w=>w.th===th),th);
for(const th of ['กู','มึง','555'])assert(!s.some(w=>w.th===th),th);
assert(s.length===list.filter(e=>e.deck==='slang').length);
assert(t.wordTrendBadge(byId.get(list.find(e=>e.th==='ปังปุริเย่').id)).includes('流行語・2019年ごろ'));
assert.equal(t.wordTrendBadge(byId.get(bank.find(w=>w.th==='กู').id)),'');
t.setCategory('');t.setWordDeck('general');
const hits=t.dictionaryResults?t.dictionaryResults('流行語'):null;if(hits)assert(hits.length>0);
// Latin letters in Japanese glosses: Z / Ｚ find Z世代, capital AI reads as the abbreviation before romanization.
for(const q of ['Z','Ｚ','z'])assert.equal(t.dictionaryResults(q)[0].w.th,'เจนแซด',q);
assert.equal(t.dictionaryResults('AI')[0].w.th,'เอไอ');assert.equal(t.dictionaryResults('DM')[0].w.th,'ดีเอ็ม');
assert(t.dictionaryResults('QR').some(x=>x.w.th==='คิวอาร์โค้ด'));assert(!t.dictionaryResults('a').some(x=>x.w.th==='เอไอ'));
// 「雷」: glosses about thunder itself (雷が鳴る, 雷が落ちる) come before the compound 雷魚.
{const r=t.dictionaryResults('雷').map(x=>x.w.th);assert(r.indexOf('ฟ้าร้อง')<r.indexOf('ปลาช่อน')&&r.indexOf('ฟ้าผ่า')<r.indexOf('ปลาช่อน'),r.join(','))}
// Sanskrit, Pali and Khmer origins are not shown; other sources (中国由来, 英語由来) still are.
const labels=new Set(bank.flatMap(w=>t.wordOriginRows(w).map(r=>r.label)));
assert(![...labels].some(l=>/サンスクリット|パーリ|クメール/.test(l)));assert(labels.has('中国由来')&&labels.has('英語由来'));
console.log(`PASS: ${list.length} curated recent words (新語/流行語); trend theme uses only new senses; slang 分類 filter; badges; Latin gloss search (Z, AI); Sanskrit/Pali/Khmer origins hidden.`);})().catch(e=>{console.error(e);process.exit(1)});
