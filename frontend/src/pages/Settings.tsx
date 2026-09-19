import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Server, Cpu, Database } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function Settings() {
  const [summary, setSummary] = useState<any>({ system_status: 'Connecting...' });
  const [latestData, setLatestData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, dataRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/dashboard/summary`),
          fetch(`${API_BASE_URL}/api/sensor-data/latest`)
        ]);
        if (sumRes.ok && dataRes.ok) {
          setSummary(await sumRes.json());
          setLatestData(await dataRes.json());
        }
      } catch (e) {
        setSummary({ system_status: 'Offline' });
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = summary.system_status === 'Online';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-6">
        <div className="p-2 bg-gray-100 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-gray-700" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings & Technical Details</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Connection Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <Server className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-900">API Backend</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">Status</span>
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">API URL</span>
              <span className="text-sm font-medium text-gray-900">{API_BASE_URL}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">Model Version</span>
              <span className="text-sm font-medium text-gray-900">v1.0 (Random Forest)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500 text-sm">App Version</span>
              <span className="text-sm font-medium text-gray-900">v2.0 (Consumer Edition)</span>
            </div>
          </div>
        </div>

        {/* Device Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <Cpu className="h-5 w-5 text-teal-500" />
            <h3 className="text-lg font-bold text-gray-900">ESP32 Device</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">Last Data Received</span>
              <span className="text-sm font-medium text-gray-900">
                {latestData ? new Date(latestData.timestamp).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">pH Sensor</span>
              <span className="text-sm font-medium text-gray-900">Calibrated (2-Point)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">Temp Sensor</span>
              <span className="text-sm font-medium text-gray-900">
                {latestData && latestData.temperature !== null ? 'Connected' : 'Disconnected / Estimated'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500 text-sm">Telemetry Rate</span>
              <span className="text-sm font-medium text-gray-900">Every 10 seconds</span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 md:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-bold text-gray-900">Database Storage</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
               <span className="text-gray-500 font-medium">Total Sensor Readings</span>
               <span className="text-2xl font-bold text-gray-900">{summary.total_readings || 0}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
               <span className="text-gray-500 font-medium">Total Health Insights</span>
               <span className="text-2xl font-bold text-gray-900">{summary.total_predictions || 0}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
