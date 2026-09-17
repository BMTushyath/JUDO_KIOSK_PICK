import React, { useState, useEffect } from 'react';
import { TournamentProvider } from './context/TournamentContext';
import DisplayPage from './pages/DisplayPage';
import AdminPage from './pages/AdminPage';
import PicPickerPage from './pages/PicPickerPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict routing for the three interfaces:
  // /         -> Main Operator (AdminPage)
  // /display  -> Public Display (DisplayPage)
  // /pic      -> PIC PICKER Mode (PicPickerPage)
  const isDisplayRoute = currentPath.startsWith('/display');
  const isPicRoute = currentPath.startsWith('/pic');

  return (
    <TournamentProvider>
      {isDisplayRoute ? (
        <DisplayPage />
      ) : isPicRoute ? (
        <PicPickerPage />
      ) : (
        <AdminPage currentPath={currentPath} />
      )}
    </TournamentProvider>
  );
}
