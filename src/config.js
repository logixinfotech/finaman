// Single source of truth for the API base URL.
//
// Nothing here is hardcoded to a machine or an IP, so ONE production build can
// be shipped to any client. Resolution order:
//
//   1. REACT_APP_API_URL  — explicit full URL, baked in at build time.
//      Use only when the API lives on a different host from the frontend.
//
//   2. REACT_APP_API_PORT — same host the page was loaded from, different port.
//      Used for `npm start` in development (page on :3000, API on :63554).
//
//   3. Neither set — the API is on the SAME origin as the page, so the base URL
//      is empty and every call becomes relative (`/api/...`). This is the
//      correct setting for a client build served by FinamanAPI.exe out of
//      finaman-erp\build, and it works at any IP without a rebuild.
//
// Note these are read at BUILD time, not at runtime: changing .env means
// running `npm run build` again.

const stripTrailingSlash = (url) => String(url).replace(/\/+$/, '');

const getApiUrl = () => {
  const explicitUrl = process.env.REACT_APP_API_URL;
  if (explicitUrl) return stripTrailingSlash(explicitUrl);

  // Guard for any non-browser context (tests, tooling).
  if (typeof window === 'undefined' || !window.location) return '';

  const { protocol, hostname, port } = window.location;
  const apiPort = process.env.REACT_APP_API_PORT;

  // No separate port configured, or it is the port we were served from:
  // same origin, so relative paths are all we need.
  if (!apiPort || apiPort === port) return '';

  return `${protocol}//${hostname}:${apiPort}`;
};

const config = {
  apiUrl: getApiUrl(),
};

export default config;
