import { useState, useEffect } from 'react';
import { initLiff, isLoggedIn, getProfile, login, logout } from '../services/liffAuth';
import { logAccess } from '../services/googleSheet';

export default function useLiff() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    initLiff().then(async (ok) => {
      setReady(true);
      if (ok && isLoggedIn()) {
        setLoggedIn(true);
        const p = await getProfile();
        setProfile(p);
        logAccess(p);
      }
    });
  }, []);

  return { ready, loggedIn, profile, login, logout };
}
