export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker.register(swUrl).then(
        (registration) => {
          console.log('ServiceWorker registered:', registration.scope);
        },
        (err) => {
          console.log('ServiceWorker registration failed:', err);
        }
      );
    });
  }
}
