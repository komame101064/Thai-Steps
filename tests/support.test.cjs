const fs=require('fs'),vm=require('vm'),assert=require('assert');
const store={},ctx={console,window:{},location:{hash:''},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({})}};vm.createContext(ctx);
for(const name of ['data','expansion','readings','vocabulary','structures','words-app','support-config'])vm.runInContext(fs.readFileSync(`dist/${name}.js`,'utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8').split("window.addEventListener('hashchange'")[0],ctx);
vm.runInContext('this.t={panels:supportPanels,link:supportLink,cfg:()=>SUPPORT_CONFIG}',ctx);const t=ctx.t;
// Shipped empty: nothing shows until the owner fills in the config.
assert.equal(t.cfg().supportUrl,'');assert.equal(t.cfg().amazonTag,'');assert.equal(t.panels(),'');assert.equal(t.link(),'');
// Filled in: a support button, and affiliate links labelled PR, tagged, sponsored, opening in a new tab.
Object.assign(t.cfg(),{supportUrl:'https://ko-fi.com/example',supportName:'Ko-fi',amazonTag:'example-22'});
const html=t.panels();assert(html.includes('https://ko-fi.com/example')&&html.includes('Ko-fi'));assert(html.includes('PR'));
assert(html.includes('tag=example-22')&&html.includes('rel="noopener sponsored"')&&html.includes('target="_blank"'));
// Unsafe URLs are ignored.
Object.assign(t.cfg(),{supportUrl:'javascript:alert(1)'});assert.equal(t.link(),'');
console.log('PASS: support and recommended materials hidden until configured; PR label, affiliate tag, sponsored links; unsafe URLs ignored.');
// A new learner (no saved words state) starts in 入門, not in all words; a saved state keeps its own range.
{const mk=saved=>{const c={console,window:{},location:{hash:''},localStorage:{getItem:k=>k==='thai-steps-words-v1'?saved:null,setItem(){}},setTimeout,clearTimeout,Date,Math,document:{querySelector:()=>({})}};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/words-app.js','utf8')+';this.lv=wordState.level',c);return c.lv};
 assert.equal(mk(null),500);assert.equal(mk(JSON.stringify({records:{},level:0})),0);assert.equal(mk(JSON.stringify({records:{},level:2000})),2000);
 console.log('PASS: first run opens in 入門; saved ranges are kept.')}
