import { useState, useEffect, useCallback } from 'react';
import { initLiff, isLoggedIn, getProfile, login, logout as liffLogout } from '../services/liffAuth';
import { logAccess, checkAccess, passwordLogin as apiPasswordLogin } from '../services/googleSheet';

export default function useLiff() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null);
  const [accessMessage, setAccessMessage] = useState('');
  const [role, setRole] = useState('user');
  const [canEditNotes, setCanEditNotes] = useState(true);
  const [authMode, setAuthMode] = useState(null); // 'line' | 'password'

  useEffect(() => {
    initLiff().then(async (ok) => {
      if (ok && isLoggedIn()) {
        setLoggedIn(true);
        setAuthMode('line');
        const p = await getProfile();
        setProfile(p);
        logAccess(p);
        const result = await checkAccess(p?.userId || '');
        if (result.allowed) {
          setAccessStatus('allowed');
          setRole(result.role || 'user');
        } else {
          setAccessStatus('blocked');
          setAccessMessage(result.reason || 'ไม่มีสิทธิ์เข้าใช้งาน');
        }
      }
      setReady(true);
    });
  }, []);

  const passwordLogin = useCallback(async (username, password) => {
    const result = await apiPasswordLogin(username, password);
    if (result.allowed) {
      setLoggedIn(true);
      setAuthMode('password');
      setAccessStatus('allowed');
      setRole(result.role || 'password_user');
      setCanEditNotes(result.canEditNotes ?? false);
      setProfile({ displayName: result.displayName || username, pictureUrl: null, userId: null });
      return { success: true };
    }
    return { success: false, reason: result.reason || 'เข้าสู่ระบบไม่สำเร็จ' };
  }, []);

  const logout = useCallback(() => {
    if (authMode === 'line') {
      liffLogout();
    } else {
      setLoggedIn(false);
      setProfile(null);
      setAccessStatus(null);
      setAuthMode(null);
      setRole('user');
      setCanEditNotes(true);
    }
  }, [authMode]);

  const isAdmin = role === 'admin';

  return { ready, loggedIn, profile, login, logout, accessStatus, accessMessage, role, isAdmin, canEditNotes, authMode, passwordLogin };
}
