import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function Trends() {
  const [history, setHistory] = useState<any[]>([]);
  const [viewDays, setViewDays] = useState<number>(7);
  const [latestData, setLatestData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resHist, resLatest] = await Promise.all([
          fetch(`${API_BASE_URL}/api/water-quality/trends?days=${viewDays}`),
          fetch(`${API_BASE_URL}/api/sensor-data/latest`)
        ]);
        if (resHist.ok && resLatest.ok) {
          setHistory(await resHist.json());
          setLatestData(await resLatest.json());
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [viewDays]);

  const labels = history.map(d => new Date(d.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));

  const createChartData = (label: string, dataKey: string, color: string) => ({
    labels: labels.length ? labels : ['Waiting...'],
    datasets: [{
      label,
      data: history.length ? history.map(d => d[dataKey] !== null ? d[dataKey] : 0) : [0],
      borderColor: color,
      backgroundColor: `${color}80`,
      tension: 0.4,
      pointRadius: viewDays > 1 ? 0 : 2,
    }]
  });

  const getTrendText = (key: string, name: string) => {
    if (history.length < 2) return `Not enough data to determine ${name} trend.`;
    const firstValid = history.find(h => h[key] !== null);
    const lastValid = [...history].reverse().find(h => h[key] !== null);
    
    if (!firstValid || !lastValid) return `Insufficient sensor data for ${name}.`;
    
    const start = firstValid[key];
    const end = lastValid[key];
    const diff = end - start;
    
    if (Math.abs(diff) < 0.1) return `${name} has remained stable over this period.`;
    if (diff > 0) return `${name} has increased slightly over this period.`;
    return `${name} has decreased slightly over this period.`;
  };

  const getStatus = (val: number, min: number, max: number) => {
    if (val === null || val === undefined) return { label: 'Unknown', color: 'text-gray-500 bg-gray-100' };
    if (val >= min && val <= max) return { label: 'Good', color: 'text-teal-700 bg-teal-50' };
    return { label: 'Needs Attention', color: 'text-orange-700 bg-orange-50' };
  };

  if (!latestData) {
    return <div className="flex justify-center items-center h-full"><p className="text-gray-500 font-medium">Loading water quality data...</p></div>;
  }

  const phStatus = getStatus(latestData.ph, 6.5, 8.5);
  const tdsStatus = getStatus(latestData.tds, 0, 500);
  const turbStatus = getStatus(latestData.turbidity, 0, 5.0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Water Quality</h2>
        <div className="flex bg-gray-100/80 backdrop-blur p-1 rounded-xl shadow-inner">
          <button onClick={() => setViewDays(1)} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${viewDays === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Today</button>
          <button onClick={() => setViewDays(7)} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${viewDays === 7 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>7 Days</button>
          <button onClick={() => setViewDays(30)} className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${viewDays === 30 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>30 Days</button>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* pH Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-50 pb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">pH Level</h3>
              <p className="text-sm text-gray-500 mt-1">Reference Range: 6.5 - 8.5</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current</p>
                <p className="text-2xl font-bold text-gray-900">{latestData.ph.toFixed(1)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${phStatus.color}`}>{phStatus.label}</span>
            </div>
          </div>
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl">
            <p className="text-gray-700 font-medium">{getTrendText('ph', 'pH')}</p>
          </div>
          <div className="h-64">
            <Line options={{ maintainAspectRatio: false, animation: { duration: 0 }, plugins: { legend: { display: false } } }} data={createChartData('pH Level', 'ph', 'rgb(20, 184, 166)')} />
          </div>
        </div>
        
        {/* TDS Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-50 pb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Total Dissolved Solids (TDS)</h3>
              <p className="text-sm text-gray-500 mt-1">Reference Range: 0 - 500 ppm</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(latestData.tds)} <span className="text-sm font-normal">ppm</span></p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tdsStatus.color}`}>{tdsStatus.label}</span>
            </div>
          </div>
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl">
            <p className="text-gray-700 font-medium">{getTrendText('tds', 'TDS')}</p>
          </div>
          <div className="h-64">
            <Line options={{ maintainAspectRatio: false, animation: { duration: 0 }, plugins: { legend: { display: false } } }} data={createChartData('TDS (ppm)', 'tds', 'rgb(59, 130, 246)')} />
          </div>
        </div>

        {/* Turbidity Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-50 pb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Turbidity (Cloudiness)</h3>
              <p className="text-sm text-gray-500 mt-1">Reference Range: 0 - 5.0 NTU</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current</p>
                <p className="text-2xl font-bold text-gray-900">{latestData.turbidity.toFixed(1)} <span className="text-sm font-normal">NTU</span></p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${turbStatus.color}`}>{turbStatus.label}</span>
            </div>
          </div>
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl">
            <p className="text-gray-700 font-medium">{getTrendText('turbidity', 'Turbidity')}</p>
          </div>
          <div className="h-64">
            <Line options={{ maintainAspectRatio: false, animation: { duration: 0 }, plugins: { legend: { display: false } } }} data={createChartData('Turbidity (NTU)', 'turbidity', 'rgb(234, 179, 8)')} />
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-50 pb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Temperature</h3>
              <p className="text-sm text-gray-500 mt-1">No strict reference limit, but extreme values may affect skin.</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current</p>
                <p className="text-2xl font-bold text-gray-900">
                  {latestData.temperature !== null ? `${latestData.temperature.toFixed(1)} °C` : 'Estimated'}
                </p>
              </div>
            </div>
          </div>
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl">
            <p className="text-gray-700 font-medium">{getTrendText('temperature', 'Temperature')}</p>
          </div>
          <div className="h-64">
            <Line options={{ maintainAspectRatio: false, animation: { duration: 0 }, plugins: { legend: { display: false } } }} data={createChartData('Temperature (°C)', 'temperature', 'rgb(239, 68, 68)')} />
          </div>
        </div>

      </div>
    </div>
  );
}
