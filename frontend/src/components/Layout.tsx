import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useApp } from '../context/AppContext';
import { isHardwareConnected } from '../utils/timeFormat';

export interface TelemetryData {
  id: number;
  timestamp: string;
  ph: number;
  tds: number | null;
  turbidity: number | null;
  temperature: number | null;
  is_connected?: boolean;
  seconds_since_last_ping?: number;
}

export interface AnalysisData {
  health_score: number;
  quality_class: string;
  risk_level: string;
  plant_suitability: string[];
  appliance_impact: string[];
  skin_risk: string;
  hair_risk?: string;
  potability: string;
  influencing_features: string[];
  probability: number;
  model_version: string;
}

export interface SharedDataContext {
  sensorData: TelemetryData | null;
  analysis: AnalysisData | null;
  isOnline: boolean;
  isApiReachable: boolean;
  lastUpdated: Date | null;
  secondsSincePing: number;
  refetch: () => Promise<void>;
  isLoading: boolean;
}

export function Layout() {
  const {
    apiBaseUrl,
    refreshInterval,
    addAlert,
    thresholds,
  } = useApp();

  const [sensorData, setSensorData] = useState<TelemetryData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isApiReachable, setIsApiReachable] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // Second-by-second ticker for real-time freshness validation
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [dataRes, analysisRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/sensor-data/latest`),
        fetch(`${apiBaseUrl}/api/analysis`),
      ]);

      if (dataRes.ok && analysisRes.ok) {
        const dataJson: TelemetryData = await dataRes.json();
        const analysisJson: AnalysisData = await analysisRes.json();

        setSensorData(dataJson);
        setAnalysis(analysisJson);
        setIsApiReachable(true);
        setLastUpdated(new Date());

        // Check if device is fresh before alarming thresholds
        const connected = isHardwareConnected(dataJson.timestamp, 30);
        if (connected) {
          if (dataJson.ph < thresholds.phMin || dataJson.ph > thresholds.phMax) {
            addAlert(`Alert: pH level (${dataJson.ph.toFixed(2)}) is outside safe range (${thresholds.phMin}-${thresholds.phMax})`);
          }
          if (dataJson.tds !== null && dataJson.tds > thresholds.tdsMax) {
            addAlert(`Alert: TDS level (${Math.round(dataJson.tds)} ppm) exceeds threshold (${thresholds.tdsMax} ppm)`);
          }
          if (dataJson.turbidity !== null && dataJson.turbidity > thresholds.turbidityMax) {
            addAlert(`Alert: Turbidity (${dataJson.turbidity.toFixed(1)} NTU) exceeds limit (${thresholds.turbidityMax} NTU)`);
          }
        }
      } else {
        setIsApiReachable(false);
      }
    } catch (err) {
      console.warn('API polling warning:', err);
      setIsApiReachable(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [apiBaseUrl, thresholds, addAlert]);

  // Initial fetch and dynamic interval loop
  useEffect(() => {
    fetchData();
    if (refreshInterval === 0) return;
    const timer = setInterval(fetchData, refreshInterval);
    return () => clearInterval(timer);
  }, [fetchData, refreshInterval]);

  // Real-time hardware freshness calculation (evaluated live against `now`)
  const { isOnline, secondsSincePing } = useMemo(() => {
    if (!sensorData || !sensorData.timestamp) {
      return { isOnline: false, secondsSincePing: 999999 };
    }
    const readingTime = new Date(
      sensorData.timestamp.endsWith('Z') ? sensorData.timestamp : sensorData.timestamp + 'Z'
    ).getTime();
    if (isNaN(readingTime)) {
      return { isOnline: false, secondsSincePing: 999999 };
    }
    const elapsedSec = Math.max(0, Math.floor((now - readingTime) / 1000));
    return {
      isOnline: isApiReachable && elapsedSec <= 30,
      secondsSincePing: elapsedSec,
    };
  }, [sensorData, isApiReachable, now]);

  const sharedContextValue: SharedDataContext = {
    sensorData,
    analysis,
    isOnline,
    isApiReachable,
    lastUpdated,
    secondsSincePing,
    refetch: fetchData,
    isLoading: isRefreshing,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isOnline={isOnline}
      />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          isOnline={isOnline}
          lastUpdated={sensorData?.timestamp ? new Date(sensorData.timestamp.endsWith('Z') ? sensorData.timestamp : sensorData.timestamp + 'Z') : lastUpdated}
          secondsSincePing={secondsSincePing}
          onManualRefresh={fetchData}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet context={sharedContextValue} />
        </main>
      </div>
    </div>
  );
}
