// Thai Steps service worker: versioned files (?v=…) are immutable and served from cache;
// everything else (the page itself, icons) is network-first with the cache as an offline fallback.
const CACHE='thai-steps-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  // keep the cache from growing forever: drop versioned entries that the current page no longer uses
  const c=await caches.open(CACHE),keys=await c.keys(),byPath={};
  for(const r of keys){const u=new URL(r.url),v=u.searchParams.get('v');if(!v)continue;(byPath[u.pathname]=byPath[u.pathname]||[]).push([v,r])}
  for(const list of Object.values(byPath)){list.sort((a,b)=>a[0]<b[0]?1:-1);for(const [,r] of list.slice(2))await c.delete(r)}
  await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
  if(u.searchParams.has('v')){e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r.ok)c.put(req,r.clone());return r}));return}
  e.respondWith(fetch(req).then(r=>{if(r.ok){const cl=r.clone();caches.open(CACHE).then(c=>c.put(req,cl))}return r}).catch(()=>caches.match(req).then(h=>h||(req.mode==='navigate'?caches.match('./'):undefined))));
});
