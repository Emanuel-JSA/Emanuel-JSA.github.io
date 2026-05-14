const CACHE = "sky-v5";

const STATIC = [
    "/",
    "/index.html",
    "/styles.css",
    "/manifest.webmanifest",
    "/src/main.js",
    "/src/router.js",
    "/src/sky/renderer.js",
    "/src/sky/world.js",
    "/src/ui/divider.js",
    "/src/ui/bot.js",
    "/src/views/home.js",
    "/src/views/post.js",
    "/assets/ascii-bem-vindo.txt",
    "/assets/ascii-bot-default.txt",
    "/assets/ascii-bot-blinking.txt",
    "/assets/ascii-bot-closed-eyes.txt",
    "/content/posts.js",
    "/content/posts/como-uma-maquina-aprende/index.html",
    "/content/posts/como-uma-maquina-aprende/index.js",
    "/content/posts/como-uma-maquina-aprende/loss-graph-animation.js",
    "/content/posts/como-uma-maquina-aprende/neural-network-animation.js",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/404.html",
];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
            ),
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    if (e.request.mode === "navigate") {
        e.respondWith(
            caches.match("/")
                .then((r) => r || caches.match("/index.html"))
                .then((r) => r || fetch("/"))
                .catch(() => fetch("/"))
        );
        return;
    }

    e.respondWith(
        caches.match(e.request).then((r) => r || fetch(e.request)),
    );
});
