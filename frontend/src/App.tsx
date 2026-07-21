import React, { useState, useEffect } from 'react';
import { Activity, Droplets, Thermometer, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Read API URL from Vite Environment (or default to localhost for local dev)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [data, setData] = useState({
    ph: 0,
    tds: 0,
    turbidity: 0,
    temperature: 0
  });

  const [analysis, setAnalysis] = useState({
    health_score: 0,
    quality_class: "Loading...",
    risk_level: "Loading...",
    plant_suitability: [],
    appliance_impact: []
  });

  const [history, setHistory] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest sensor data
        const dataRes = await fetch(`${API_BASE_URL}/api/latest-data`);
        if (dataRes.ok) {
          const latestData = await dataRes.json();
          setData(latestData);
          setIsOnline(true);

          // Update chart history (keep last 7 points)
          setHistory(prev => {
            const newHistory = [...prev, latestData.ph];
            if (newHistory.length > 7) newHistory.shift();
            return newHistory;
          });
          
          setLabels(prev => {
            const timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            const newLabels = [...prev, timeString];
            if (newLabels.length > 7) newLabels.shift();
            return newLabels;
          });
        }

        // Fetch analysis
        const analysisRes = await fetch(`${API_BASE_URL}/api/analysis`);
        if (analysisRes.ok) {
          const latestAnalysis = await analysisRes.json();
          setAnalysis(latestAnalysis);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsOnline(false);
      }
    };

    // Fetch immediately on load
    fetchData();
    
    // Then poll every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: labels.length > 0 ? labels : ['Waiting for data...'],
    datasets: [
      {
        label: 'pH Level',
        data: history.length > 0 ? history : [0],
        borderColor: 'rgb(20, 184, 166)',
        backgroundColor: 'rgba(20, 184, 166, 0.5)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Droplets className="h-8 w-8 text-aqua-500" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AquaPulse</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-sm font-medium text-gray-600">
              {isOnline ? 'System Online' : 'System Offline / Connecting...'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="pH Level" value={data.ph.toFixed(2)} unit="" icon={<Activity className="text-purple-500" />} />
          <MetricCard title="TDS" value={Math.round(data.tds).toString()} unit="ppm" icon={<Droplets className="text-blue-500" />} />
          <MetricCard title="Turbidity" value={data.turbidity.toFixed(1)} unit="NTU" icon={<AlertTriangle className="text-yellow-500" />} />
          <MetricCard title="Temperature" value={data.temperature.toFixed(1)} unit="°C" icon={<Thermometer className="text-red-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Real-time Trends</h2>
            <div className="h-72">
              <Line options={{ maintainAspectRatio: false, animation: { duration: 0 } }} data={chartData} />
            </div>
          </div>

          {/* AI Health Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">AI Health Analysis</h2>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Health Score</span>
              <span className="text-3xl font-bold text-aqua-500">{analysis.health_score}</span>
            </div>

            <div>
              <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Quality Class</span>
              <div className="mt-1 flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium text-lg">{analysis.quality_class}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Suitable For</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.plant_suitability.length > 0 ? analysis.plant_suitability.map(plant => (
                  <span key={plant} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    {plant}
                  </span>
                )) : <span className="text-sm text-gray-400">None detected</span>}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Appliance Impact</span>
              <ul className="mt-2 space-y-1">
                {analysis.appliance_impact.length > 0 ? analysis.appliance_impact.map(impact => (
                  <li key={impact} className="text-sm text-gray-700 flex items-center before:content-['•'] before:mr-2 before:text-aqua-500">
                    {impact}
                  </li>
                )) : <span className="text-sm text-gray-400">No data</span>}
              </ul>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

function MetricCard({ title, value, unit, icon }: { title: string, value: string, unit: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {unit && <p className="ml-1 text-sm font-medium text-gray-500">{unit}</p>}
      </div>
    </div>
  )
}

export default App
