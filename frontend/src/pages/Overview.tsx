import React, { useState, useEffect } from 'react';
import { Droplets, AlertTriangle, Activity, Thermometer } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function Overview() {
  const [data, setData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataRes, analysisRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/sensor-data/latest`),
          fetch(`${API_BASE_URL}/api/analysis`) // assuming it returns HealthAnalysisResponse
        ]);
        if (dataRes.ok && analysisRes.ok) {
          setData(await dataRes.json());
          setAnalysis(await analysisRes.json());
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (e) {
        setIsOnline(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data || !analysis) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500 font-medium">Loading water quality data...</p>
      </div>
    );
  }

  // Determine overall status
  let overallStatus = "Water is Good";
  let statusColor = "bg-teal-50 text-teal-800 border-teal-200";
  let statusExplanation = "Your current water readings are generally within the configured reference ranges. No major water-quality issue is detected at the moment.";

  if (analysis.quality_class === "Unsafe" || analysis.risk_level === "High Risk") {
    overallStatus = "Water Quality is Poor";
    statusColor = "bg-red-50 text-red-800 border-red-200";
    statusExplanation = "Your water readings are outside safe reference ranges. We recommend taking action to improve your water quality.";
  } else if (analysis.quality_class === "Moderate") {
    overallStatus = "Water Needs Attention";
    statusColor = "bg-yellow-50 text-yellow-800 border-yellow-200";
    statusExplanation = "Some water parameters are slightly elevated or outside the ideal range. Prolonged use might cause minor issues.";
  }

  const isSafeSkin = analysis.skin_risk.includes("Safe");

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Primary Status Banner */}
      <div className={`p-8 rounded-3xl border ${statusColor} shadow-sm transition-colors duration-300`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">{overallStatus}</h2>
            <p className="text-lg opacity-90 max-w-3xl leading-relaxed">{statusExplanation}</p>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-white/20 shadow-sm">
            <span className="flex h-3 w-3 relative">
              {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-sm font-medium text-gray-800">
              {isOnline ? 'System Online' : 'System Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-gray-500 mb-1">pH</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{data.ph.toFixed(1)}</p>
          <p className="text-sm text-gray-600 leading-snug">
            {data.ph >= 6.5 && data.ph <= 8.5 ? "Ideal range for skin and hair." : "Outside ideal range. May cause dryness."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-gray-500 mb-1">TDS</p>
          <div className="flex items-baseline space-x-1 mb-2">
            <p className="text-3xl font-bold text-gray-900">{Math.round(data.tds)}</p>
            <p className="text-sm font-medium text-gray-500">ppm</p>
          </div>
          <p className="text-sm text-gray-600 leading-snug">
            {data.tds <= 300 ? "Low dissolved solids." : data.tds <= 500 ? "Acceptable mineral levels." : "High minerals. May leave residue."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-gray-500 mb-1">Turbidity</p>
          <div className="flex items-baseline space-x-1 mb-2">
            <p className="text-3xl font-bold text-gray-900">{data.turbidity.toFixed(1)}</p>
            <p className="text-sm font-medium text-gray-500">NTU</p>
          </div>
          <p className="text-sm text-gray-600 leading-snug">
            {data.turbidity <= 5.0 ? "Water appears relatively clear." : "Water appears cloudy."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Temperature</p>
            {data.temperature !== null ? (
              <div className="flex items-baseline space-x-1 mb-2">
                <p className="text-3xl font-bold text-gray-900">{data.temperature.toFixed(1)}</p>
                <p className="text-sm font-medium text-gray-500">°C</p>
              </div>
            ) : (
              <div className="flex items-baseline space-x-1 mb-2">
                <p className="text-3xl font-bold text-gray-400">25.0</p>
                <p className="text-sm font-medium text-gray-400">°C</p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-snug">
             {data.temperature !== null ? "Current water temperature." : "Estimated — temp sensor disconnected"}
          </p>
        </div>
      </div>

      {/* Health Summary */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Health Summary</h3>
        
        {!isSafeSkin && (
          <div className="mb-6 bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <h4 className="text-lg font-semibold text-orange-900 mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Possible Concern: {analysis.skin_risk}
            </h4>
            <p className="text-orange-800 leading-relaxed mb-3">
              Based on the current water characteristics, prolonged use may be associated with {analysis.skin_risk.toLowerCase()} in some people.
            </p>
            <div className="text-sm text-orange-700 font-medium">
              Why? {analysis.influencing_features.join(' ')}
            </div>
          </div>
        )}

        {isSafeSkin && (
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed text-lg">
              Based on the current readings, the water characteristics appear normal and do not present any immediate skin or hair concerns.
            </p>
          </div>
        )}

        <div className="mt-8">
          <h4 className="text-md font-semibold text-gray-900 mb-3">What you can do</h4>
          <ul className="space-y-3">
            {!isSafeSkin && (
              <li className="flex items-start">
                <div className="bg-gray-100 p-1.5 rounded-full mr-3 mt-0.5">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">Improve water treatment or consider adding a shower filter.</span>
              </li>
            )}
            <li className="flex items-start">
              <div className="bg-gray-100 p-1.5 rounded-full mr-3 mt-0.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
              <span className="text-gray-700">Maintain proper hygiene and moisturize skin if dryness occurs.</span>
            </li>
            <li className="flex items-start">
              <div className="bg-gray-100 p-1.5 rounded-full mr-3 mt-0.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
              <span className="text-gray-700">Monitor changes in water quality over the next few days.</span>
            </li>
            <li className="flex items-start">
              <div className="bg-gray-100 p-1.5 rounded-full mr-3 mt-0.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
              <span className="text-gray-700">Consult a healthcare professional if any skin or hair symptoms persist or worsen.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
