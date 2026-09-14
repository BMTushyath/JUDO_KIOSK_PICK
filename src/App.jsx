import React, { useState, useEffect } from 'react';
import { TournamentProvider } from './context/TournamentContext';
import DisplayPage from './pages/DisplayPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict routing for the two interfaces
  const isDisplayRoute = currentPath.startsWith('/display');

  return (
    <TournamentProvider>
      {isDisplayRoute ? (
        <DisplayPage />
      ) : (
        <AdminPage currentPath={currentPath} />
      )}
    </TournamentProvider>
  );
}
