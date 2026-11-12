const fs=require('fs'),vm=require('vm'),assert=require('assert');
const store={};const ctx={window:{},localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},fetch:async()=>({ok:false}),view:'home',render(){},esc:s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]),icon:()=>'',toast(){},document:{getElementById:()=>null}};vm.createContext(ctx);
for(const n of ['kana-search','word-topics','word-origins','ja-readings','words-app'])vm.runInContext(fs.readFileSync('dist/'+n+'.js','utf8'),ctx);
vm.runInContext('render=()=>{};refreshWordList=()=>{};this.t={rememberSearch,searchHistory,searchHistoryChips,clearSearchHistory,setDictionaryQuery,setResults:f=>{dictionaryResults=f}}',ctx);const t=ctx.t;
assert.equal(t.searchHistoryChips('home'),'');
for(const q of ['雷','ไทย','  ','食べる','雷'])t.rememberSearch(q);
assert.deepEqual([...t.searchHistory()],['雷','食べる','ไทย'],'newest first, no blanks, no duplicates');
for(let i=0;i<12;i++)t.rememberSearch('q'+i);assert.equal(t.searchHistory().length,8,'keeps the 8 most recent');
const html=t.searchHistoryChips('home');assert(html.includes('最近の検索')&&html.includes('searchWordsFromHome')&&html.includes('data-q="q11"'));
assert(t.searchHistoryChips('words').includes('useHistorySearch'));
t.rememberSearch('<b>');assert(t.searchHistoryChips('home').includes('&lt;b&gt;'),'escaped');
store['thai-steps-search-history']='not json';assert.deepEqual([...t.searchHistory()],[]);
t.rememberSearch('x');t.clearSearchHistory();assert.deepEqual([...t.searchHistory()],[]);
// Typing in the words-page dictionary is saved after a short pause when it finds something.
ctx.setTimeout=(f)=>{f();return 1};ctx.clearTimeout=()=>{};vm.runInContext('setTimeout=globalThis.setTimeout;clearTimeout=globalThis.clearTimeout',ctx);t.setResults(()=>[1]);t.setDictionaryQuery('ข้าว');assert.equal(t.searchHistory()[0],'ข้าว');t.setResults(()=>[]);t.setDictionaryQuery('zzqq');assert.notEqual(t.searchHistory()[0],'zzqq','no hits, not saved');
console.log('PASS: recent dictionary searches — newest first, 8 kept, deduplicated, escaped, safe on bad storage, clearable.');
