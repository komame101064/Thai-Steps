const fs=require('fs'),vm=require('vm'),assert=require('assert');
const names=['word-bank.json','slang-bank.json','word-bank-more.json','slang-bank-more.json','more-examples.json'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync('dist/'+n,'utf8'))]));
const store={};let now=1000;const D=class extends Date{static now(){return now+=1000}};
const ctx={console,window:{scrollTo(){}},document:{querySelector:()=>({}),getElementById:()=>null},location:{hash:''},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v)},Date:D,Math,setTimeout,clearTimeout,fetch:async u=>data[u]?{ok:true,json:async()=>data[u]}:{ok:false}};
vm.createContext(ctx);
for(const n of ['data','expansion','readings','vocabulary','structures','kana-search','word-topics','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext("render=()=>{};toast=()=>{};refreshWordScreen=()=>{};this.t={loadWordBank,getBank:()=>bank,favoriteWord,wordRec,favorites,setFavSort,sortFavWords,favWords,sanitizeWordState,getState:()=>wordState,setTab:d=>{favTab=d;view='favorites'},getSort:()=>favSort}",ctx);
(async()=>{const t=ctx.t;await t.loadWordBank();const b=t.getBank();
 const pick=th=>b.find(w=>w.th===th&&w.collection!=='slang');const ws=['สวัสดี','กิน','ทุเรียน','บ้าน'].map(pick);
 for(const w of ws)t.favoriteWord(w.id);
 // Each new favorite records when it was added; removing it drops the time.
 assert(ws.every(w=>t.wordRec(w.id).favorite&&t.wordRec(w.id).favAt>0));
 const ids=xs=>xs.map(w=>w.th);t.setTab('general');
 t.setFavSort('added-desc');assert.deepEqual(ids(t.sortFavWords(t.favWords('general'))),['บ้าน','ทุเรียน','กิน','สวัสดี']);
 t.setFavSort('added-asc');assert.deepEqual(ids(t.sortFavWords(t.favWords('general'))),['สวัสดี','กิน','ทุเรียน','บ้าน']);
 t.setFavSort('frequency');{const f=t.sortFavWords(t.favWords('general'));assert(f.every((w,i)=>!i||f[i-1].frequency>=w.frequency))}
 t.setFavSort('thai');{const f=ids(t.sortFavWords(t.favWords('general')));assert.deepEqual(f,[...f].sort((a,c)=>a.localeCompare(c,'th')))}
 // 苦手な順: a word answered wrong comes first.
 t.getState().records[ws[2].id].wrong=3;t.setFavSort('weak');assert.equal(t.sortFavWords(t.favWords('general'))[0].th,'ทุเรียน');
 // The choice is remembered on this device, an unknown value is ignored, and the menu is on the page.
 t.setFavSort('nonsense');assert.equal(t.getSort(),'weak');assert.equal(store['thai-steps-fav-sort'],'weak');
 const html=t.favorites();assert(html.includes('お気に入りの並べ替え')&&html.includes('追加が新しい順'));
 // Saved data keeps the time for favorites only; an un-favorited word loses it.
 t.favoriteWord(ws[0].id);assert(!t.wordRec(ws[0].id).favorite&&!('favAt' in t.wordRec(ws[0].id)));
 const s=t.sanitizeWordState({records:{[ws[1].id]:{favorite:true,favAt:5},[ws[0].id]:{favorite:false,favAt:9}}});
 assert.equal(s.records[ws[1].id].favAt,5);assert(!('favAt' in s.records[ws[0].id]));
 console.log('PASS: favorites sort by added (new/old), frequency, weakness, Thai and Japanese order; added time recorded and saved; choice remembered per device.');
})().catch(e=>{console.error(e);process.exit(1)});
