import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Trends } from './pages/Trends';
import { HealthInsights } from './pages/HealthInsights';
import { HistoryLogs } from './pages/HistoryLogs';
import { Settings } from './pages/Settings';
import Readings from './pages/Readings';
import RemoteController from './pages/RemoteController';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Desktop Dashboard Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="readings" element={<Readings />} />
            <Route path="trends" element={<Trends />} />
            <Route path="health" element={<HealthInsights />} />
            <Route path="history" element={<HistoryLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Standalone Mobile Virtual Hardware Remote Controller */}
          <Route path="/remote" element={<RemoteController />} />
          <Route path="/controller" element={<RemoteController />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
