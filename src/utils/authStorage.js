const KEYS = { token: "token", user: "user", permissions: "permissions" };

export const authStorage = {
  save({ token, user, permissions }) {
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.user, JSON.stringify(user || {}));
    localStorage.setItem(KEYS.permissions, JSON.stringify(permissions ?? null));
  },
  getToken() {
    return localStorage.getItem(KEYS.token);
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem(KEYS.user) || "null"); }
    catch { return null; }
  },
  getPermissions() {
    try { return JSON.parse(localStorage.getItem(KEYS.permissions) || "null"); }
    catch { return null; }
  },
  clear() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};