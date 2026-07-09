import { useState, useEffect, useCallback } from 'react';
import App from './App';
import { Archive } from './components/Archive';

function getRoute(): string {
  return window.location.pathname;
}

export function Router() {
  const [route, setRoute] = useState(getRoute);
  const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark'));

  useEffect(() => {
    const onPopState = () => setRoute(getRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [isDarkMode]);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setRoute(getRoute());
    window.scrollTo(0, 0);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(
          'theme-preference',
          JSON.stringify({ theme: next ? 'dark' : 'light', timestamp: Date.now() })
        );
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  if (route === '/archive') {
    return (
      <Archive
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
        onNavigate={navigate}
      />
    );
  }

  return (
    <App
      isDarkMode={isDarkMode}
      onThemeToggle={handleThemeToggle}
      onNavigate={navigate}
    />
  );
}
