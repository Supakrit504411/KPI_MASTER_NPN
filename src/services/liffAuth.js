import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

let _profile = null;
let _initPromise = null;

export function initLiff() {
  if (_initPromise) return _initPromise;
  if (!LIFF_ID) {
    _initPromise = Promise.resolve(false);
    return _initPromise;
  }
  _initPromise = liff
    .init({ liffId: LIFF_ID })
    .then(() => true)
    .catch((err) => {
      console.warn('LIFF init failed:', err.message);
      return false;
    });
  return _initPromise;
}

export function isLoggedIn() {
  return LIFF_ID && liff.isLoggedIn();
}

export function login() {
  if (!liff.isLoggedIn()) {
    liff.login();
  }
}

export function logout() {
  if (liff.isLoggedIn()) {
    liff.logout();
    _profile = null;
    window.location.reload();
  }
}

export async function getProfile() {
  if (_profile) return _profile;
  if (!liff.isLoggedIn()) return null;
  try {
    _profile = await liff.getProfile();
    return _profile;
  } catch {
    return null;
  }
}

export function isInLiffBrowser() {
  return liff.isInClient?.() ?? false;
}

export { liff };
