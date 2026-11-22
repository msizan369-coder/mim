window.AppAuth = (() => {
  const STORAGE_KEY = 'activeUser';
  const LEGACY_ROLE_KEY = 'activeRole';

  function parseUserCandidate(raw) {
    if (!raw) return null;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'string') {
        const clean = parsed.trim().toLowerCase();
        if (clean === 'sam' || clean === 'mim') {
          return {
            username: clean,
            displayName: clean === 'sam' ? 'Sam' : 'Mim',
            role: clean === 'sam' ? 'sender' : 'viewer',
            canImpersonate: clean === 'sam',
            redirectTo: clean === 'sam' ? '/chat.html' : '/story.html'
          };
        }
      }
      if (parsed && typeof parsed === 'object' && parsed.username) {
        const clean = String(parsed.username).trim().toLowerCase();
        if (clean === 'sam' || clean === 'mim') {
          return {
            username: clean,
            displayName: parsed.displayName || (clean === 'sam' ? 'Sam' : 'Mim'),
            role: parsed.role || (clean === 'sam' ? 'sender' : 'viewer'),
            canImpersonate:
              typeof parsed.canImpersonate === 'boolean'
                ? parsed.canImpersonate
                : clean === 'sam',
            redirectTo:
              parsed.redirectTo || (clean === 'sam' ? '/chat.html' : '/story.html')
          };
        }
      }
    } catch (_e) {
      const clean = String(raw).trim().toLowerCase();
      if (clean === 'sam' || clean === 'mim') {
        return {
          username: clean,
          displayName: clean === 'sam' ? 'Sam' : 'Mim',
          role: clean === 'sam' ? 'sender' : 'viewer',
          canImpersonate: clean === 'sam',
          redirectTo: clean === 'sam' ? '/chat.html' : '/story.html'
        };
      }
    }
    return null;
  }

  function getUser() {
    const fromLocal = parseUserCandidate(localStorage.getItem(STORAGE_KEY));
    if (fromLocal) return fromLocal;

    const fromSession = parseUserCandidate(sessionStorage.getItem(STORAGE_KEY));
    if (fromSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fromSession));
      return fromSession;
    }

    return null;
  }

  function setUser(userObj) {
    const normalized = parseUserCandidate(userObj);
    if (!normalized) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(LEGACY_ROLE_KEY, normalized.role);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    sessionStorage.setItem(LEGACY_ROLE_KEY, normalized.role);
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_ROLE_KEY);
  }

  function requireAuth(loginPath = '/index.html') {
    const user = getUser();
    if (!user) {
      window.location.replace(loginPath);
      return null;
    }
    return user;
  }

  function bindLogout(buttonId = 'logout-btn', onBeforeLogout = null) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (typeof onBeforeLogout === 'function') {
        try {
          onBeforeLogout();
        } catch (_e) {}
      }
      clearUser();
      window.location.href = '/index.html';
    });
  }

  return {
    getUser,
    setUser,
    clearUser,
    requireAuth,
    bindLogout
  };
})();