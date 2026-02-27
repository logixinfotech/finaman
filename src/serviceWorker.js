// This file will handle service worker registration and caching

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(\.[0-9]+){0,3}:[0-9]+$/
    )
  );
  
  const registerValidSW = (swUrl) => {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  };
  
  const register = () => {
    if ('serviceWorker' in navigator) {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
  
      if (isLocalhost) {
        fetch(swUrl)
          .then((response) => {
            if (response.status === 404) {
              console.log('Service worker not found');
            } else if (response.ok) {
              registerValidSW(swUrl);
            }
          })
          .catch((error) => {
            console.error('Error fetching service worker:', error);
          });
      } else {
        registerValidSW(swUrl);
      }
    }
  };
  
  export default register;
  