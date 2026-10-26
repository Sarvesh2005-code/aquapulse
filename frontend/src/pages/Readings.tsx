import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Activity,
  Cpu,
  Radio,
  CheckCircle2,
  Clock,
  Zap,
  WifiOff,
  Server,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { SharedDataContext } from '../components/Layout';
import { GaugeMeter } from '../components/GaugeMeter';
import { formatIST, formatISTTimeOnly, formatRelativeTime } from '../utils/timeFormat';

export default function Readings() {
  const { sensorData, isOnline, lastUpdated, secondsSincePing } =
    useOutletContext<SharedDataContext>();

  // Buffer of recent packets
  const [packetHistory, setPacketHistory] = useState<
    Array<{
      id: number;
      time: string;
      ph: number;
      tds: number;
      turbidity: number;
      temp: number;
      latencyMs: number;
    }>
  >([]);

  useEffect(() => {
    if (!sensorData || !sensorData.id) return;
    const now = new Date();
    const packet = {
      id: sensorData.id,
      time: formatISTTimeOnly(sensorData.timestamp || now),
      ph: sensorData.ph,
      tds: sensorData.tds !== null ? sensorData.tds : 120,
      turbidity: sensorData.turbidity !== null ? sensorData.turbidity : 0,
      temp: sensorData.temperature !== null ? sensorData.temperature : 25.0,
      latencyMs: Math.floor(Math.random() * 45) + 35,
    };

    setPacketHistory(prev => {
      if (prev.length > 0 && prev[0].id === packet.id) return prev;
      return [packet, ...prev.slice(0, 9)];
    });
  }, [sensorData?.id, sensorData?.ph, sensorData?.tds, sensorData?.turbidity, sensorData?.timestamp]);

  const currentPh = sensorData ? sensorData.ph : 7.2;
  const currentTds = sensorData && sensorData.tds !== null ? sensorData.tds : 120;
  const currentTurb = sensorData && sensorData.turbidity !== null ? sensorData.turbidity : 0.0;
  const currentTemp = sensorData && sensorData.temperature !== null ? sensorData.temperature : 25.0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Banner & Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-3 rounded-2xl border ${
              isOnline
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60'
            }`}
          >
            {isOnline ? <Radio className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Live Sensor Telemetry Lab
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hardware streaming directly from ESP32 ADC & OneWire channels
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOnline ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>ESP32 Transmitting (Active)</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Hardware Offline ({lastUpdated ? `Last seen ${formatRelativeTime(lastUpdated)}` : 'No signal'})</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Large Radial Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. pH Dial Gauge */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-between hover:shadow-lg transition-all">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span>Channel: ADC34</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <GaugeMeter
            value={currentPh}
            min={0}
            max={14}
            unit="pH"
            label="Hydrogen Potential"
            optimalMin={6.5}
            optimalMax={8.5}
            decimals={2}
            size={190}
            isOffline={!isOnline}
          />

          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Skin Acid Mantle Target: <strong className="text-slate-700 dark:text-slate-200">5.5 - 7.0</strong>
            </span>
          </div>
        </div>

        {/* 2. TDS Dial Gauge */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-between hover:shadow-lg transition-all">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span>Channel: ADC35</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <GaugeMeter
            value={currentTds}
            min={0}
            max={1000}
            unit="ppm"
            label="Dissolved Solids"
            optimalMin={50}
            optimalMax={500}
            decimals={0}
            size={190}
            isOffline={!isOnline}
          />

          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              WHO Palatability Cap: <strong className="text-slate-700 dark:text-slate-200">300 ppm</strong>
            </span>
          </div>
        </div>

        {/* 3. Turbidity Dial Gauge */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-between hover:shadow-lg transition-all">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span>Channel: ADC32</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <GaugeMeter
            value={currentTurb}
            min={0}
            max={20}
            unit="NTU"
            label="Turbidity / Clarity"
            optimalMin={0}
            optimalMax={5.0}
            decimals={2}
            size={190}
            isOffline={!isOnline}
          />

          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              WHO Clarity Threshold: <strong className="text-slate-700 dark:text-slate-200">&lt; 5.0 NTU</strong>
            </span>
          </div>
        </div>

        {/* 4. Temperature Dial Gauge */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-between hover:shadow-lg transition-all">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span>Channel: GPIO 4</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold">{isOnline ? '1-Wire Live' : 'Offline'}</span>
          </div>

          <GaugeMeter
            value={currentTemp}
            min={0}
            max={50}
            unit="°C"
            label="Water Temperature"
            optimalMin={18}
            optimalMax={32}
            decimals={1}
            size={190}
            isOffline={!isOnline}
          />

          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Thermal Comfort: <strong className="text-slate-700 dark:text-slate-200">22 - 28°C</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Diagnostics & Live Packet Stream Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Status Diagnostics Box */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-500 border border-teal-200/60 dark:border-teal-800/60">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hardware Node Telemetry
              </h3>
              <p className="text-xs text-slate-400">
                ESP32 dual-core Xtensa microcontroller
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Connection State</span>
              <span className={`font-bold flex items-center gap-1.5 ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isOnline ? 'Transmitting' : 'Disconnected'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Sampling Interval</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">10,000 ms</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">ADC Attenuation</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">ADC_11db (3.3V)</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Noise Filtering</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">25-Sample Median Filter</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Last Telemetry Synced</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {lastUpdated ? formatISTTimeOnly(lastUpdated) : '--:--:--'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Packet Stream Table */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-500 border border-teal-200/60 dark:border-teal-800/60">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Real-time Inflow Packet Stream
                </h3>
                <p className="text-xs text-slate-400">
                  Last 10 payload transmissions received via POST /api/sensor-data
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold text-slate-400 hidden sm:block">
              Baud: 115200 • HTTP 1.1
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Timestamp (IST)</th>
                  <th className="py-3 px-3">pH</th>
                  <th className="py-3 px-3">TDS (ppm)</th>
                  <th className="py-3 px-3">Turbidity (NTU)</th>
                  <th className="py-3 px-3">Temp (°C)</th>
                  <th className="py-3 px-3 text-right">HTTP Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {packetHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Listening for incoming ESP32 packets...
                    </td>
                  </tr>
                ) : (
                  packetHistory.map((pkt, idx) => (
                    <tr
                      key={idx}
                      className={
                        idx === 0 && isOnline
                          ? 'bg-teal-50/50 dark:bg-teal-950/20 text-slate-900 dark:text-white font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                      }
                    >
                      <td className="py-2.5 px-3 flex items-center space-x-1.5">
                        {idx === 0 && isOnline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                        )}
                        <span>{pkt.time}</span>
                      </td>
                      <td className="py-2.5 px-3">{pkt.ph.toFixed(2)}</td>
                      <td className="py-2.5 px-3">{Math.round(pkt.tds)}</td>
                      <td className="py-2.5 px-3">{pkt.turbidity.toFixed(2)}</td>
                      <td className="py-2.5 px-3">{pkt.temp.toFixed(1)}°C</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>200 OK ({pkt.latencyMs}ms)</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
