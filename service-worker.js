/* ==========================================================================
   Service Worker — GraTools
   هدف: کش کردن فایل‌های اصلی برای بارگذاری سریع‌تر و دسترسی محدود آفلاین
   ========================================================================== */

const CACHE_NAME = "gratools-cache-v1";

// فایل‌های اصلی که باید در اولین نصب کش شوند
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./sites.json",
  "./manifest.json",
  "./Estedad-VariableFont_wght.ttf",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// نصب: کش کردن فایل‌های پایه
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// فعال‌سازی: حذف کش‌های قدیمی نسخه‌های قبلی
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// استراتژی: Network First برای sites.json (داده تازه)، Cache First برای بقیه
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // فقط درخواست‌های GET را مدیریت کن
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // برای sites.json همیشه ابتدا تلاش برای دریافت نسخه تازه از شبکه
  if (url.pathname.endsWith("sites.json")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // برای بقیه فایل‌ها: ابتدا کش، در صورت نبود از شبکه بگیر و کش کن
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
