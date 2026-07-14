const CACHE_NAME = "alltagsbegleiter-pwa-v17.0";
const APP_FILES = [
  "./VERSION_17.txt",
  "./Barmherzigkeitsrosenkranz-Tablet.html",
  "./Dankgebete.html",
  "./Gebete-und-Lebensregeln.html",
  "./Klangschale-Tablet.html",
  "./Kreuzweg_App_tablet.html",
  "./Rosenkranz-Tablet.html",
  "./Tagesgebete.html",
  "./Wecker-Tablet.html",
  "./abendabschluss-mobile.html",
  "./alltagsbegleiter-sync.js",
  "./alltagsbegleiter-view.js",
  "./andachtsschrank.html",
  "./apnoe-tracker-tablet.html",
  "./arzttermine.html",
  "./aufgaben.html",
  "./bibelleseplan_26-28_tablet.html",
  "./bibelleseplan_28-30_tablet.html",
  "./bibliothek-v10.html",
  "./blutdruck-app-tablet.html",
  "./energiezaehler_tablet.html",
  "./erinnerungen-native.html",
  "./gewicht-tablet.html",
  "./handy.html",
  "./heute-mobile.html",
  "./heute.html",
  "./icon-192.png",
  "./icon-512.png",
  "./impfungen.html",
  "./index-system.html",
  "./index.html",
  "./jahresbuch.html",
  "./kapelle-mobile.html",
  "./kapelle-v10.html",
  "./kartaeuser-stundenbuch/dienstag.html",
  "./kartaeuser-stundenbuch/donnerstag.html",
  "./kartaeuser-stundenbuch/freitag.html",
  "./kartaeuser-stundenbuch/index.html",
  "./kartaeuser-stundenbuch/matutin_dienstag.html",
  "./kartaeuser-stundenbuch/matutin_donnerstag.html",
  "./kartaeuser-stundenbuch/matutin_freitag.html",
  "./kartaeuser-stundenbuch/matutin_mittwoch.html",
  "./kartaeuser-stundenbuch/matutin_montag.html",
  "./kartaeuser-stundenbuch/matutin_samstag.html",
  "./kartaeuser-stundenbuch/matutin_sonntag.html",
  "./kartaeuser-stundenbuch/mittwoch.html",
  "./kartaeuser-stundenbuch/montag.html",
  "./kartaeuser-stundenbuch/samstag.html",
  "./kartaeuser-stundenbuch/sonntag.html",
  "./klosterkompass.html",
  "./komfortzentrum.html",
  "./kreuzgang.html",
  "./laborwerte.html",
  "./lebensbuch.html",
  "./manifest.webmanifest",
  "./medikamente.html",
  "./mobile.html",
  "./motorola-g55-mobile.css",
  "./native-alarm.js",
  "./nordicwalking-tablet.html",
  "./notfallpass.html",
  "./pilgerarchiv.html",
  "./refektorium.html",
  "./regel-des-lebens.html",
  "./reiki_tagesritual_tablet.html",
  "./rituale.html",
  "./schatzkammer.html",
  "./schnellnotiz-mobile.html",
  "./shared-store.js",
  "./sicherung-v10.html",
  "./skriptorium.html",
  "./spirituelle-bibliothek/icon-192.png",
  "./spirituelle-bibliothek/icon-512.png",
  "./spirituelle-bibliothek/index.html",
  "./spirituelle-bibliothek/lesejahr_a.html",
  "./spirituelle-bibliothek/lesejahr_b.html",
  "./spirituelle-bibliothek/lesejahr_c.html",
  "./stille-mobile.html",
  "./stundenbuch_tablet.html",
  "./suche.html",
  "./synchronisation.html",
  "./tablet.html",
  "./trainings-schrank.html",
  "./trainingscheck-tablet.html",
  "./vorsorge-mobile.html",
  "./vorsorgezentrum.html"
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigations: always try the current online version first.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
    return;
  }

  // Static files: cache first, refresh silently.
  event.respondWith(caches.match(event.request).then(cached => {
    const network = fetch(event.request).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || network;
  }));
});
