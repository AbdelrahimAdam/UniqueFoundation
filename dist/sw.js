self.addEventListener("install", () => {
  console.log("Unique Foundation Service Worker installed.");
});

self.addEventListener("activate", () => {
  console.log("Unique Foundation Service Worker activated.");
});

self.addEventListener("fetch", (event) => {
  // Optional caching logic can go here later
});
