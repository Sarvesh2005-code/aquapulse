import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Save,
  RotateCcw,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Settings() {
  const {
    apiBaseUrl,
    thresholds,
    setThresholds,
    addAlert,
  } = useApp();

  const [summary, setSummary] = useState<any>({ system_status: 'Connecting...' });
  const [tempThresholds, setTempThresholds] = useState(thresholds);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ latency: number | null; ok: boolean }>({
    latency: null,
    ok: false,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      const start = performance.now();
      try {
        const res = await fetch(`${apiBaseUrl}/api/dashboard/summary`);
        const duration = Math.round(performance.now() - start);
        if (res.ok) {
          const json = await res.json();
          setSummary(json);
          setPingStatus({ latency: duration, ok: true });
        } else {
          setPingStatus({ latency: null, ok: false });
        }
      } catch (err) {
        setPingStatus({ latency: null, ok: false });
      }
    };
    fetchSummary();
  }, [apiBaseUrl]);

  const handleSaveThresholds = () => {
    setThresholds(tempThresholds);
    setSaveSuccess(true);
    addAlert('Custom safety thresholds saved successfully.');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetThresholds = () => {
    const defaultVals = {
      phMin: 6.5,
      phMax: 8.5,
      tdsMax: 500,
      turbidityMax: 5.0,
      tempMax: 35.0,
    };
    setTempThresholds(defaultVals);
    setThresholds(defaultVals);
    setSaveSuccess(true);
    addAlert('Safety thresholds reset to WHO benchmarks.');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System & IoT Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hardware ADC channel mapping, API telemetry bridge, & safety thresholds
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Node Firmware: AquaPulse v2.0
          </span>
        </div>
      </div>

      {/* Grid: Hardware Channels & Backend Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ESP32 Physical Channel Mapping */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-500 border border-teal-200/60 dark:border-teal-800/60">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ESP32 GPIO & ADC Channel Map
              </h3>
              <p className="text-xs text-slate-400">Pin allocations on 30-pin NodeMCU ESP32</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Analog pH Sensor Probe</span>
                <p className="text-[10px] text-slate-400 font-sans">Linear slope mapping with 2-point buffer calibration</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold">
                GPIO 34 (ADC1_CH6)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Analog TDS Meter V1.0</span>
                <p className="text-[10px] text-slate-400 font-sans">Compensated voltage scaled to ppm (parts per million)</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold">
                GPIO 35 (ADC1_CH7)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Turbidity Sensor Module</span>
                <p className="text-[10px] text-slate-400 font-sans">Optical phototransistor transmittance to NTU scale</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold">
                GPIO 32 (ADC1_CH4)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">DS18B20 Temp Probe</span>
                <p className="text-[10px] text-slate-400 font-sans">Dallas 1-Wire protocol with 4.7kΩ pullup</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold">
                GPIO 4 (OneWire)
              </span>
            </div>
          </div>
        </div>

        {/* Backend & AI Classifier Diagnostics */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 border border-blue-200/60 dark:border-blue-800/60">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  FastAPI Backend Diagnostics
                </h3>
                <p className="text-xs text-slate-400">Endpoint availability & database status</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                pingStatus.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              {pingStatus.ok ? `Connected (${pingStatus.latency}ms)` : 'Offline'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Target Endpoint</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {apiBaseUrl}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">AI Model Architecture</span>
              <span className="font-semibold text-teal-600 dark:text-teal-400">
                Random Forest Classifier (n=100)
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Total Telemetry Samples</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {summary.total_readings ?? 0} Inflow Rows
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Total AI Health Inferences</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {summary.total_predictions ?? 0} Predictions Saved
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5">
              <span className="text-slate-500 dark:text-slate-400">Database Engine</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                SQLite via SQLAlchemy ORM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customizable Thresholds Calibration */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200/60 dark:border-amber-800/60">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Threshold Calibration & Safety Bounds
              </h3>
              <p className="text-xs text-slate-400">
                Adjust trigger limits for automated water quality alerts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetThresholds}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to WHO</span>
            </button>
            <button
              onClick={handleSaveThresholds}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Safety parameters saved! Real-time alerts will now follow these configured thresholds.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* pH Minimum */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Minimum pH Threshold
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={tempThresholds.phMin}
              onChange={e => setTempThresholds({ ...tempThresholds, phMin: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
            />
            <span className="text-[10px] text-slate-400">Default: 6.5 (Acidic below)</span>
          </div>

          {/* pH Maximum */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Maximum pH Threshold
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={tempThresholds.phMax}
              onChange={e => setTempThresholds({ ...tempThresholds, phMax: parseFloat(e.target.value) || 14 })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
            />
            <span className="text-[10px] text-slate-400">Default: 8.5 (Alkaline above)</span>
          </div>

          {/* TDS Max */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Max TDS Alert (ppm)
            </label>
            <input
              type="number"
              step="10"
              min="50"
              max="2000"
              value={tempThresholds.tdsMax}
              onChange={e => setTempThresholds({ ...tempThresholds, tdsMax: parseFloat(e.target.value) || 500 })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
            />
            <span className="text-[10px] text-slate-400">Default: 500 ppm (Hard water)</span>
          </div>

          {/* Turbidity Max */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Max Turbidity (NTU)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={tempThresholds.turbidityMax}
              onChange={e => setTempThresholds({ ...tempThresholds, turbidityMax: parseFloat(e.target.value) || 5.0 })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
            />
            <span className="text-[10px] text-slate-400">Default: 5.0 NTU (Cloudy)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
