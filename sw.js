const CACHE_NAME = "kdcf-v5-2026-03-01";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/about.html",
  "/services.html",
  "/projects.html",
  "/branches.html",
  "/contact.html",
  "/tender.html",
  "/investor.html",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/assets/css/styles.css",
  "/assets/js/main.js",
  "/assets/img/logo.jpg",
  "/assets/img/hero.jpg",
  "/content/settings.json",
  "/content/services.json",
  "/content/projects.json",
  "/content/products.json",
  "/content/team.json",
  "/content/testimonials.json",
  "/content/clients.json",
  "/content/certifications.json",
  "/content/investor.json",
  "/content/tender.json",
  "/content/branches.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : null)))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);
  if(url.origin !== location.origin) return;

  // Network-first for content JSON so CMS updates show quickly
  const isContent = url.pathname.startsWith("/content/");
  if(isContent){
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for other assets
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res)=>{
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return res;
    }))
  );
});
