import { useState, useEffect } from 'react';
import { initLiff, isLoggedIn, getProfile, login, logout } from '../services/liffAuth';
import { logAccess, checkAccess } from '../services/googleSheet';

export default function useLiff() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null); // null=checking, 'allowed', 'blocked', 'not_found'
  const [accessMessage, setAccessMessage] = useState('');
  const [role, setRole] = useState('user');

  useEffect(() => {
    initLiff().then(async (ok) => {
      if (ok && isLoggedIn()) {
        setLoggedIn(true);
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

  const isAdmin = role === 'admin';

  return { ready, loggedIn, profile, login, logout, accessStatus, accessMessage, role, isAdmin };
}
