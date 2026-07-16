
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:63554";
  }

  if (hostname.startsWith("192.168.1.")) {
    return "http://192.168.1.42:63554";
  }

  return "http://122.160.143.110:63554";
};
// http://finamanerp.com:63554





const config = {
  apiUrl: getApiUrl(),
};

export default config;


