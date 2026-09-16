/* Service worker : coquille de l'app disponible hors-ligne */
const CACHE = "onboarding-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/state.js",
  "./js/config.js",
  "./js/utils.js",
  "./js/auth.js",
  "./js/renders.js",
  "./js/planning.js",
  "./js/modele.js",
  "./js/users.js",
  "./js/detail.js",
  "./js/main.js",
  "./js/pwa.js",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  /* Navigations : réseau d'abord (toujours la dernière version), repli cache */
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(rep => { const copie = rep.clone();
                       caches.open(CACHE).then(c => c.put("./index.html", copie));
                       return rep; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  /* Autres ressources même origine : cache d'abord, puis réseau + mise en cache */
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(rep => {
        const copie = rep.clone();
        caches.open(CACHE).then(c => c.put(e.request, copie));
        return rep;
      }))
    );
  }
});
