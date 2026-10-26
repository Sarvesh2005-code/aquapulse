import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Thresholds {
  phMin: number;
  phMax: number;
  tdsMax: number;
  turbidityMax: number;
  tempMax: number;
}

interface AppContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  refreshInterval: number;
  setRefreshInterval: (ms: number) => void;
  thresholds: Thresholds;
  setThresholds: React.Dispatch<React.SetStateAction<Thresholds>>;
  apiBaseUrl: string;
  alerts: string[];
  dismissAlert: (index: number) => void;
  addAlert: (msg: string) => void;
}

const defaultThresholds: Thresholds = {
  phMin: 6.5,
  phMax: 8.5,
  tdsMax: 500,
  turbidityMax: 5.0,
  tempMax: 35.0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('aquapulse_dark_mode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [refreshInterval, setRefreshInterval] = useState<number>(3000);
  const [thresholds, setThresholds] = useState<Thresholds>(defaultThresholds);
  const [alerts, setAlerts] = useState<string[]>([]);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    localStorage.setItem('aquapulse_dark_mode', JSON.stringify(isDarkMode));
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const addAlert = (msg: string) => {
    setAlerts(prev => [msg, ...prev.slice(0, 9)]);
  };

  const dismissAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        refreshInterval,
        setRefreshInterval,
        thresholds,
        setThresholds,
        apiBaseUrl,
        alerts,
        dismissAlert,
        addAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
