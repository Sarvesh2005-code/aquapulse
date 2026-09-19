import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function HistoryLogs() {
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      let start = startDate;
      let end = endDate;
      
      if (filter !== 'custom') {
        const now = new Date();
        end = now.toISOString();
        if (filter === 'day') {
          now.setDate(now.getDate() - 1);
        } else if (filter === 'week') {
          now.setDate(now.getDate() - 7);
        } else if (filter === 'month') {
          now.setMonth(now.getMonth() - 1);
        }
        start = now.toISOString();
      }

      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);

      // Fetch health history since it contains both sensor readings and health predictions
      const res = await fetch(`${API_BASE_URL}/api/health/history?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter, startDate, endDate]);

  const exportData = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${row[k]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aquapulse_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">History</h2>
        <button onClick={exportData} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 shadow-sm transition-colors">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-4 items-center bg-gray-50/50">
          <div className="flex bg-gray-200/50 p-1 rounded-xl shadow-inner">
            <button onClick={() => setFilter('day')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${filter === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>1 Day</button>
            <button onClick={() => setFilter('week')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${filter === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>1 Week</button>
            <button onClick={() => setFilter('month')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${filter === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>1 Month</button>
            <button onClick={() => setFilter('custom')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${filter === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Custom</button>
          </div>

          {filter === 'custom' && (
            <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-none bg-transparent outline-none text-sm font-medium text-gray-700 px-2" />
              <span className="text-gray-400 font-medium">to</span>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-none bg-transparent outline-none text-sm font-medium text-gray-700 px-2" />
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Water Readings</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Health Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((record, idx) => {
                const dateObj = new Date(record.timestamp);
                const isSafe = record.predicted_condition.includes('Safe');
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <div className="text-xs text-gray-500">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isSafe ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>
                         {isSafe ? 'Good' : 'Needs Attention'}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 space-x-3">
                        <span><span className="text-gray-400">pH:</span> {record.ph.toFixed(1)}</span>
                        <span><span className="text-gray-400">TDS:</span> {Math.round(record.tds)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${isSafe ? 'text-gray-600' : 'text-gray-900'}`}>
                        {record.predicted_condition}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No history found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
