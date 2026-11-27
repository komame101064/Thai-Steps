const fs=require('fs'),vm=require('vm'),assert=require('assert');
// Layout markup kept by the 2026-11-28 pass: denser word rows, capped relation blocks, one breakdown hint per word page,
// lesson notes without a repeated reading, and no decorative speaker on the listening face.
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json','sense-examples.json','slang-examples.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const store={};const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({}),createElement:()=>({setAttribute(){},className:''})},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},Date,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','advanced','curriculum','grammar-deep','kana-search','word-topics','word-origins','ja-readings','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};this.t={loadWordBank,loadSenseExamples,getMap:()=>bankMap,getBank:()=>bank,openWord,wordDetail,wordListHTML,relationBlock,startWords,wordSessionView,exitWordSession,setQuiz:m=>{wordQuizMode=m},setQuery:q=>{wordQuery=q;wordPage=0},setDeck:d=>{wordDeck=d;wordPage=0},structures,japanesePattern,romanizeThai,readingPieces:typeof readingPieces==='function'?readingPieces:null}",ctx);
const rows=html=>html.split('<article class="w-row w-row2">').slice(1);
(async()=>{const t=ctx.t;await t.loadWordBank();await t.loadSenseExamples();const m=t.getMap(),by=th=>t.getBank().find(w=>w.th===th&&w.collection!=='slang');
 // Rows (word list, dictionary, phrases): Thai / [品詞] reading / Japanese with ＋N / one line holding the chips, then the English.
 const checkRows=(html,label)=>{const rs=rows(html);assert(rs.length>=20,label+' rows '+rs.length);let plus=0;for(const r of rs){
  const foot=r.match(/<div class="w-row-foot"><div class="w-meta">[\s\S]*?<\/div>(<span class="w-en" lang="en"[^>]*>[^<]*<\/span>)?<\/div><\/div><\/button>/);assert(foot,label+' chips and English share one line container: '+r.slice(0,200));
  assert(!/<div class="w-en"/.test(r),label+' no separate English line');assert(r.indexOf('w-row-foot')>r.indexOf('class="w2-ja"'),label+' order');
  const ja=r.match(/<div class="w2-ja">([\s\S]*?)<\/div><div class="w-row-foot">/);assert(ja,label+' Japanese line');
  if(/＋\d/.test(r)){plus++;assert(/<span class="w2-tail">[^<]+(<small class="w-reference"[^>]*>[^<]*<\/small>)?<small>＋\d+<\/small><\/span>$/.test(ja[1]),label+' ＋N kept on the Japanese line with its last character: '+ja[1])}
  assert(/class="w-audio is-icon"/.test(r)&&/favoriteWord\('/.test(r)&&/reviewWord\('/.test(r),label+' three buttons')}
  return plus};
 t.setDeck('general');t.setQuery('');assert(checkRows(t.wordListHTML(),'list')>0,'some rows have ＋N');
 t.setQuery('たべる');checkRows(t.wordListHTML(),'dictionary');
 t.setQuery('eat');{const h=t.wordListHTML();checkRows(h,'dictionary en');assert(/<span class="w-en" lang="en"[^>]*>to eat/.test(h),'English hit kept in the row')}
 t.setQuery('');t.setDeck('phrase');checkRows(t.wordListHTML(),'phrases');t.setDeck('general');
 // つながりで覚える: at most 6 cards per group, most frequent first, the rest under もっと見る（残り N）; nothing is lost.
 let capped=0,sharedOnce=0,perCard=0;
 for(const w of t.getBank()){if(w.collection==='slang')continue;for(const [type,title] of [['ant','対義語'],['syn','類義語'],['similar','混同しやすい語'],['related','関連語']]){const html=t.relationBlock(w,type,title);if(!html)continue;
  const ids=(w.relations[type]||[]).filter(id=>m.has(id)),shown=html.split('<details')[0],more=html.match(/<details class="w-related-more"><summary>もっと見る（残り (\d+)）<\/summary>([\s\S]*)<\/details>/);
  const cardIds=h=>[...h.matchAll(/<button onclick="openWord\('(tl-\d+)'\)">/g)].map(x=>x[1]);const a=cardIds(shown),b=more?cardIds(more[2]):[];
  assert(a.length===Math.min(6,ids.length),w.id+' '+type+' shown '+a.length);assert.deepEqual([...a,...b].sort(),[...ids].sort(),w.id+' every card kept');
  if(ids.length>6){capped++;assert(more&&Number(more[1])===ids.length-6,w.id+' rest count')}else assert(!more);
  const f=[...a,...b].map(id=>m.get(id).frequency);for(let i=1;i<f.length;i++)assert(f[i-1]>=f[i],w.id+' '+type+' frequency order');
  const head=html.match(/<h3>[^<]*(<em class="w-relation-context is-shared">「(.*?)」<\/em>)?<\/h3>/);assert(head,html.slice(0,300));const tags=[...html.matchAll(/<em class="w-relation-context">「([^」]*)」<\/em>/g)].map(x=>x[1]);
  if(head[1]){sharedOnce++;assert.equal(tags.length,0,w.id+' shared tag not repeated on the cards')}else if(tags.length){perCard++;assert(ids.length===1||new Set(tags).size>1||tags.length<ids.length,w.id+' identical tags would be printed once')}}}
 assert(capped>400&&sharedOnce>500&&perCard>0,`capped ${capped} shared ${sharedOnce} perCard ${perCard}`);
 {const kin=by('กิน'),html=t.relationBlock(kin,'related','関連語');assert(/<h3>関連語 <em class="w-relation-context is-shared">「食べる」<\/em><\/h3>/.test(html),'กิน: 「食べる」 once by the heading');assert.equal((html.match(/「食べる」/g)||[]).length,1)}
 // The 単語に分解 hint appears once on the word page, not under every example.
 {const kin=by('กิน');t.openWord(kin.id);const html=t.wordDetail();assert((html.match(/class="w-seg"/g)||[]).length>=2,'กิน has several breakdowns');assert.equal((html.match(/押すとその単語へ移動します/g)||[]).length,1,'hint once')}
 // Lesson notes: the inserted reading is not followed by the same reading in brackets (lessons 7, 9 and 42).
 {assert(t.readingPieces,'readingPieces');const read=s=>t.readingPieces(s).map(x=>typeof x==='string'?x:t.romanizeThai(x.th)).join('');
  const deep=fs.readFileSync('dist/grammar-deep.js','utf8').match(/ยิ่งใหญ่（yîng yài）[^'"`]*/)[0];
  const notes=[t.japanesePattern(t.structures[6][1]),t.japanesePattern(t.structures[8][1]),deep].map(read);
  assert(notes[0].startsWith('疑問のmǎiは文の後ろ')&&!notes[0].includes('mǎi（mǎi）'),notes[0]);
  assert(notes[1].includes('文末にchâi mǎi。')&&!notes[1].includes('（châi mǎi）'),notes[1]);
  assert(notes[2].startsWith('yîng yàiは「偉大な')&&!notes[2].includes('（yîng yài）'),notes[2]);
  assert.equal(read('ไหม（ใช่）'),'mǎi（châi）','a different bracket stays')}
 // 聞き取り: only the real audio button, no decorative speaker beside it.
 {const ids=['กิน','ช้าง','ร้อน','เพื่อน','ทำงาน'].map(th=>by(th).id);t.setQuiz('listen');t.startWords('quiz',ids);const html=t.wordSessionView();assert(!html.includes('w-listen-mark'),'no listen mark');assert.equal((html.match(/class="w-audio is-icon"/g)||[]).length,1,'one audio button');t.exitWordSession();t.setQuiz('th-ja')}
 console.log(`PASS: layout — rows keep chips + English on one line and ＋N on the Japanese line; ${capped} relation groups capped at 6 (rest under もっと見る), ${sharedOnce} shared sense tags printed once; one breakdown hint per word page; lesson notes 7/9/42 without a repeated reading; no decorative speaker in 聞き取り.`);
})().catch(e=>{console.error(e);process.exit(1)});
