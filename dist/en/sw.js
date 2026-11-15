// English Steps service worker (its own app and cache, scoped to this folder; independent of Thai Steps).
const CACHE='english-steps-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin||!u.pathname.startsWith(new URL('./',self.registration.scope).pathname))return;
 if(u.searchParams.has('v')){e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r.ok)c.put(req,r.clone());return r}));return}
 e.respondWith(fetch(req).then(r=>{if(r.ok){const cl=r.clone();caches.open(CACHE).then(c=>c.put(req,cl))}return r}).catch(()=>caches.match(req).then(h=>h||(req.mode==='navigate'?caches.match('./'):undefined))))});
