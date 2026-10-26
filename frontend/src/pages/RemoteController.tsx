import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Radio,
  Send,
  Zap,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  Server,
  Play,
  Square,
  Droplets,
} from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  icon: string;
  desc: string;
  ph: number;
  tds: number;
  turbidity: number;
  temperature: number;
  expectedSkin: string;
  expectedHair: string;
}

const WATER_PRESETS: Preset[] = [
  {
    id: 'pristine',
    name: 'Pristine RO Water',
    icon: '💧',
    desc: 'Balanced mineral WHO standard drinking water.',
    ph: 7.3,
    tds: 115,
    turbidity: 0.8,
    temperature: 24.0,
    expectedSkin: 'Safe (No Skin Risk)',
    expectedHair: 'Optimal Scalp & Hair Vitality',
  },
  {
    id: 'hard',
    name: 'Hard Borewell Water',
    icon: '🏔️',
    desc: 'High dissolved solids causing calcium scale & dryness.',
    ph: 8.9,
    tds: 680,
    turbidity: 2.1,
    temperature: 25.0,
    expectedSkin: 'Dry Skin Risk',
    expectedHair: 'Cuticle Scaling & Breakage',
  },
  {
    id: 'acidic',
    name: 'Acidic Rain / Runoff',
    icon: '🌧️',
    desc: 'Low pH causing stinging sensation and scalp itching.',
    ph: 5.2,
    tds: 320,
    turbidity: 4.8,
    temperature: 26.2,
    expectedSkin: 'Scalp Irritation Risk',
    expectedHair: 'Follicular Stinging & Frizz',
  },
  {
    id: 'turbid',
    name: 'Turbid Pond Water',
    icon: '🌊',
    desc: 'High suspended particles and microbial vulnerability.',
    ph: 6.3,
    tds: 590,
    turbidity: 14.5,
    temperature: 27.5,
    expectedSkin: 'Skin Irritation Risk',
    expectedHair: 'Microbial Scalp Build-up',
  },
];

export default function RemoteController() {
  const defaultApi = import.meta.env.VITE_API_URL || 'https://aquapulse-ne52.onrender.com';
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem('aquapulse_remote_api') || defaultApi;
  });

  const [ph, setPh] = useState<number>(7.3);
  const [tds, setTds] = useState<number>(115);
  const [turbidity, setTurbidity] = useState<number>(0.8);
  const [temperature, setTemperature] = useState<number>(24.0);

  const [activePresetId, setActivePresetId] = useState<string>('pristine');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamIntervalSec, setStreamIntervalSec] = useState<number>(4);
  const [lastResponse, setLastResponse] = useState<{
    status: number | null;
    ok: boolean;
    time: string;
    latency: number;
    message: string;
  } | null>(null);

  const [packetCount, setPacketCount] = useState<number>(0);
  const [isSending, setIsSending] = useState<boolean>(false);

  const streamTimerRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('aquapulse_remote_api', apiUrl);
  }, [apiUrl]);

  const applyPreset = (preset: Preset) => {
    setActivePresetId(preset.id);
    setPh(preset.ph);
    setTds(preset.tds);
    setTurbidity(preset.turbidity);
    setTemperature(preset.temperature);
  };

  const transmitPacket = async (values?: { ph: number; tds: number; turbidity: number; temp: number }) => {
    const curPh = values ? values.ph : ph;
    const curTds = values ? values.tds : tds;
    const curTurb = values ? values.turbidity : turbidity;
    const curTemp = values ? values.temp : temperature;

    const payload = {
      ph: parseFloat(curPh.toFixed(2)),
      tds: parseFloat(curTds.toFixed(1)),
      turbidity: parseFloat(curTurb.toFixed(2)),
      temperature: parseFloat(curTemp.toFixed(1)),
      ph_status: 'valid',
      temp_source: 'sensor',
    };

    const startTime = performance.now();
    setIsSending(true);

    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/sensor-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const latency = Math.round(performance.now() - startTime);
      const nowStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date());

      if (res.ok) {
        setPacketCount(prev => prev + 1);
        setLastResponse({
          status: res.status,
          ok: true,
          time: nowStr,
          latency,
          message: `Packet #${packetCount + 1} delivered successfully (${latency}ms)`,
        });
      } else {
        setLastResponse({
          status: res.status,
          ok: false,
          time: nowStr,
          latency,
          message: `HTTP ${res.status}: Failed to accept telemetry`,
        });
      }
    } catch (err: any) {
      const nowStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date());

      setLastResponse({
        status: null,
        ok: false,
        time: nowStr,
        latency: 0,
        message: `Network error: Could not connect to API server`,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Continuous Auto-stream loop
  useEffect(() => {
    if (!isStreaming) {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      return;
    }

    // Send first packet immediately
    transmitPacket();

    streamTimerRef.current = setInterval(() => {
      // Add subtle real-world sensor micro-noise (±0.03 pH, ±2 ppm TDS, ±0.08 NTU)
      const jitterPh = +(ph + (Math.random() * 0.06 - 0.03)).toFixed(2);
      const jitterTds = Math.max(0, +(tds + (Math.random() * 4 - 2)).toFixed(0));
      const jitterTurb = Math.max(0, +(turbidity + (Math.random() * 0.16 - 0.08)).toFixed(2));
      const jitterTemp = +(temperature + (Math.random() * 0.2 - 0.1)).toFixed(1);

      transmitPacket({
        ph: jitterPh,
        tds: jitterTds,
        turbidity: jitterTurb,
        temp: jitterTemp,
      });
    }, streamIntervalSec * 1000);

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [isStreaming, ph, tds, turbidity, temperature, streamIntervalSec, apiUrl]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-5">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/"
            className="flex items-center space-x-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>Mobile IoT Node</span>
          </div>
        </div>

        {/* Title Card */}
        <div className="p-5 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <Radio className={`w-5 h-5 ${isStreaming ? 'animate-pulse text-emerald-400' : ''}`} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>AquaPulse Remote</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Virtual ESP32 Telemetry Controller
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                isStreaming
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isStreaming ? 'STREAMING ACTIVE' : 'STANDBY'}
            </span>
          </div>

          {/* Target API input */}
          <div className="pt-2 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3 text-slate-500" />
                <span>Target Backend API</span>
              </span>
              <button
                onClick={() => setApiUrl('https://aquapulse-ne52.onrender.com')}
                className="text-[10px] text-teal-400 hover:underline"
              >
                Set Render URL
              </button>
            </div>
            <input
              type="text"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl font-mono text-[11px] text-teal-300 focus:outline-none focus:border-teal-500"
              placeholder="https://aquapulse-ne52.onrender.com"
            />
          </div>
        </div>

        {/* 1-Tap Water Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            1-Tap Water Presets
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {WATER_PRESETS.map(preset => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-teal-950/40 border-teal-500 shadow-md shadow-teal-500/10'
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{preset.icon}</span>
                    <span className="text-xs font-bold text-white leading-tight">
                      {preset.name}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400 space-x-1.5">
                    <span>pH {preset.ph}</span>
                    <span>•</span>
                    <span>{preset.tds}ppm</span>
                  </div>
                  <div className="mt-1 text-[9px] font-semibold text-teal-400">
                    {preset.expectedSkin}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Sliders */}
        <div className="p-5 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span>Precision Sensor Tuning</span>
            </span>
            <span className="text-[10px] text-slate-400">Live ADC emulators</span>
          </div>

          {/* pH Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">pH Level (Acidity / Alkalinity)</span>
              <span className="font-mono font-bold text-teal-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                {ph.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              step="0.05"
              value={ph}
              onChange={e => {
                setActivePresetId('custom');
                setPh(parseFloat(e.target.value));
              }}
              className="w-full accent-teal-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 (Acidic)</span>
              <span className="text-emerald-400">6.5 - 8.5 Ideal</span>
              <span>14 (Alkaline)</span>
            </div>
          </div>

          {/* TDS Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">TDS (Dissolved Solids)</span>
              <span className="font-mono font-bold text-teal-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                {Math.round(tds)} ppm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="5"
              value={tds}
              onChange={e => {
                setActivePresetId('custom');
                setTds(parseFloat(e.target.value));
              }}
              className="w-full accent-teal-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 ppm (Pure RO)</span>
              <span className="text-emerald-400">&lt; 300 Clean</span>
              <span>1000 ppm (Hard)</span>
            </div>
          </div>

          {/* Turbidity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">Turbidity (Water Clarity)</span>
              <span className="font-mono font-bold text-teal-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                {turbidity.toFixed(2)} NTU
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="0.1"
              value={turbidity}
              onChange={e => {
                setActivePresetId('custom');
                setTurbidity(parseFloat(e.target.value));
              }}
              className="w-full accent-teal-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.0 (Crystal)</span>
              <span className="text-emerald-400">&lt; 5.0 WHO Limit</span>
              <span>25.0 (Cloudy)</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">Water Temperature</span>
              <span className="font-mono font-bold text-teal-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                {temperature.toFixed(1)}°C
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              step="0.5"
              value={temperature}
              onChange={e => {
                setActivePresetId('custom');
                setTemperature(parseFloat(e.target.value));
              }}
              className="w-full accent-teal-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10°C (Cold)</span>
              <span className="text-emerald-400">22 - 28°C Ambient</span>
              <span>45°C (Hot)</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Single Send Button */}
            <button
              onClick={() => transmitPacket()}
              disabled={isSending || isStreaming}
              className="py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-teal-600/25 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending...' : 'Send Once'}</span>
            </button>

            {/* Auto Stream Toggle */}
            <button
              onClick={() => setIsStreaming(prev => !prev)}
              className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all ${
                isStreaming
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
              }`}
            >
              {isStreaming ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Auto-Stream</span>
                </>
              )}
            </button>
          </div>

          {/* Stream interval selector (visible when streaming) */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Auto-Stream Cadence</span>
            <div className="flex space-x-1.5 font-mono text-[11px]">
              {[2, 4, 8, 10].map(sec => (
                <button
                  key={sec}
                  onClick={() => setStreamIntervalSec(sec)}
                  className={`px-2 py-0.5 rounded-lg border transition-colors ${
                    streamIntervalSec === sec
                      ? 'bg-teal-500 text-slate-900 border-teal-400 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Delivery Status Log */}
        {lastResponse && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-2.5 transition-all animate-in fade-in ${
              lastResponse.ok
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
            }`}
          >
            {lastResponse.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>{lastResponse.ok ? 'Telemetry Streamed' : 'Transmission Error'}</span>
                <span className="font-mono text-[10px] opacity-75">{lastResponse.time}</span>
              </div>
              <p className="text-[11px] opacity-90">{lastResponse.message}</p>
            </div>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-500 pt-1">
          <span>AquaPulse Hardware Simulation Bridge • Total Packets: </span>
          <strong className="text-slate-300 font-mono">{packetCount}</strong>
        </div>
      </div>
    </div>
  );
}
